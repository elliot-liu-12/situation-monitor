import os
import tomllib
from log import log_error
import sys
import ollama
from uuid import uuid4
import argparse
from filelock import FileLock

def read_headlines():
    try: os.remove("analysis.txt")
    except: pass
    lock = FileLock("headlines.txt.lock", timeout=10, thread_local=False)
    try:
        with lock:
            try:
                with open("headlines.txt", "r") as f:
                    headlines = []
                    for line in f:
                        cleaned = line.strip()
                        headlines.append(cleaned)
                        if (len(headlines) == chunk_size):
                            analyze_chunk(headlines)
                            headlines.clear()
                if(len(headlines) > 0):
                    analyze_chunk(headlines)
            except Exception as e:
                log_error(f"Failed to open headlines {str(e)}")
    except:
        log_error("File lock couldn't be acquired")
    finally:
        lock.release()

def analyze_chunk(chunk):
    text = "\n".join(chunk)
    try:
        if test_mode:
            resp = ollama.generate(model=analysis_model, prompt=analysis_test_prompt+"\n"+text)
        else:
            resp = ollama.generate(model=analysis_model, prompt=analysis_prompt+"\n"+ portfolio +"\n"+ text)
                
        lock = FileLock("analysis.txt.lock", timeout=10, thread_local=False)
        try:
            with lock:
                with open(f"analysis.txt", "a", encoding="utf-8") as f:
                    f.write(resp["response"])
        except: 
            log_error("Couldn't acquire lock for analysis.txt")
        finally: lock.release()
    except Exception as e:
        log_error(f"Error analyzing chunk{str(e)}")

if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument("--test", help="Turns on test mode, which doesn't require the user's portfolio", action="store_true")
        args = parser.parse_args()

        test_mode = False
        if args.test:
            test_mode = True
            print("Test mode turned on")
    except Exception as e:
        log_error(f"Failed to parse arguments: {str(e)}")
    try:
        with open("config.toml", "rb") as cfg:
            config = tomllib.load(cfg)
        chunk_size = config["chunk_size"]
        analysis_model = config["analysis_model"]
        analysis_prompt = config["analysis_prompt"]
        analysis_test_prompt = config["analysis_test_prompt"]
        portfolio_char_limit = config["portfolio_char_limit"]
    except Exception as e:
        log_error(f"Config file not found or couldn't be opened {str(e)}")
        sys.exit(1)
    # read portfolio from stdin process
    if test_mode == False:
        portfolio = sys.stdin.read(portfolio_char_limit)
        print(f"Portfolio: {portfolio}")
        if portfolio == "":
            log_error("Portfolio empty while test mode is off. Exiting...")
            sys.exit(2)
    read_headlines()