import asyncio
import base64
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai import LLMExtractionStrategy, LLMConfig
from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher
from pathlib import Path
from PIL import Image
import json
import os
import io
import ollama
from ollama import Client
import aiofiles
import uuid
from log import log_error
import tomllib
import sys

async def extract_with_generated_pattern():
    cache_dir = Path("./pattern_cache")
    cache_dir.mkdir(exist_ok=True)
    pattern_file = cache_dir / "extraction_pattern.json"

    #Generate or load the extraction pattern
    if pattern_file.exists():
        pattern = json.load(pattern_file.open())
        print("Using existing extraction pattern.")
    else:
        print("Generating new extraction pattern.")

        #Configure LLM
        llmConfig = LLMConfig(
            provider="ollama/gemma3:12b",
        )

        #async with AsyncWebCrawler() as crawler:
            #results.await crawler.arun_many()

async def remove_old_screenshots(dir):
    with os.scandir(dir) as d:
        for s in d:
            try:
                os.remove(s.path)
            except Exception as e:
                    async with aiofiles.open("errors.log", "a") as f:
                        await f.write(f"Screenshot {s.name} could not be deleted: {str(e)}\n")
                        await f.flush()

async def take_screenshots(urls):
    dispatcher = MemoryAdaptiveDispatcher (
        memory_threshold_percent=100,
        check_interval=1.0,
        max_session_permit=10,
    )

    md_generator = DefaultMarkdownGenerator(
        content_filter=PruningContentFilter(threshold=0.4, threshold_type="fixed", min_word_threshold=10),
        options={
            "ignore_links": True,
            "ignore_images": True,
            "minimum_word_count": 10
        }
    )

    extraction_strategy = LLMExtractionStrategy(
        model="gemma3:4b",
        llm_config=LLMConfig(provider="ollama"),
        extraction_type="block",
        instruction="""Extract all headlines from the page. A headline is a single sentence that summarizes a news story.
            DO NOT include any other content from the website and omit sentences about the website name itself. If something isn't a headline, or might not be a headline, 
            DON'T INCLUDE IT! It is FINE to stop the output if no headlines are found.""",
        schema=["headline"]
    )

    browser_cfg = BrowserConfig(
        browser_type="chromium", 
        headless=True,
        viewport_width=viewport_width,
        viewport_height=viewport_height
        )

    extraction_strategy_heuristic = 1

    run_conf = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, 
                                markdown_generator=md_generator,
                                magic=True, simulate_user=True,
                                override_navigator=True,
                                remove_overlay_elements=True,
                                screenshot=True,
                                page_timeout=60000)
    # first remove old screenshots
    await remove_old_screenshots("./screenshots")

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        results = await crawler.arun_many(
        urls=urls,
        config=run_conf,
        dispatcher=dispatcher,
        stream=True)
        
        for result in results:
            if result.screenshot:
                # must convert from bmp to png so that LLM can read image
                raw = result.screenshot
                bmp = base64.b64decode(raw)
                img = Image.open(io.BytesIO(bmp))
                
                # crop image to preserve LLM accuracy and prevent looping
                (left, upper, right, lower) = (0, 0, viewport_width, viewport_height)
                img = img.crop((left, upper, right, lower))

                png_io = io.BytesIO()
                img.save(png_io, format="PNG")
                png_bytes = png_io.getvalue()

                os.makedirs("screenshots", exist_ok=True)
                try:
                    async with aiofiles.open("screenshots/" + extract_website_name(result.url) + ".png", "wb") as f:
                        await f.write(png_bytes)
                        await f.flush()
                except Exception as e:
                    async with aiofiles.open("errors.log", "a") as f:
                        await f.write(f"Screenshot from {result.url} not saved: {str(e)}\n")
                        await f.flush()

def extract_website_name(url):
    if url.startswith("https://"):
        url = url[8:] 
    elif url.startswith("http://"):
        url = url[7:] 
    
    # Find the last dot before any path or query parameters
    # First, remove any path/query/fragment parts
    if '/' in url:
        url = url.split('/')[0]
    if '?' in url:
        url = url.split('?')[0]
    if '#' in url:
        url = url.split('#')[0]
    
    # Find the last dot and extract everything before it
    last_dot_index = url.rfind('.')
    if last_dot_index != -1:
        return url[:last_dot_index]
    else:
        # If no dot found, return the whole string
        return url
    
def extract_headlines():
    try:
        os.remove("headlines.txt")
    except:
        pass
    client= Client(

    )
    with os.scandir("./screenshots") as d:
        for s in d:
            if s.is_file and (s.name[-4:] == ".png" or s.name[-4:] == ".jpg" or s.name[-5:] == ".jpeg"):
                try:
                    print(s.name)
                    resp = ollama.generate(
                        model=image_model, prompt=transcription_prompt, images=[s.path], stream=False, options={"context": 8192})
                    with open("headlines.txt", "a") as f:
                        f.write(resp["response"])
                        
                except Exception as e:
                    log_error(f"Error reading file {s.path}: {str(e)}\n")

if __name__ == "__main__":
    try: 
        with open("config.toml", "rb") as cfg:
            config = tomllib.load(cfg)
    except Exception as e:
        log_error(f"Error opening config file {str(e)}")
        sys.exit(1)

    urls = config["urls"]
    viewport_width = config["viewport_width"]
    viewport_height = config["viewport_height"]
    image_model = config["image_model"]
    transcription_prompt = config["transcription_prompt"]
    asyncio.run(take_screenshots(urls))
    #run transcription synchronously to save resources
    extract_headlines()
    # sys exit to tell Node that script is finished
    sys.exit(0)