import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Selector } from './components/selector/selector'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ResultTable } from '@/components/resulttable/resulttable'
import { parseString } from '@/components/resulttable/parsestring'
import { Row } from "@/components/resulttable/row"
import './App.css'

function App() {
  const [showSelector, setShowSelector] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [scanButtonText, setScanButtonText] = useState("Run Scan");
  const [tags, setTags] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<Row[]>([]);
  const handleSelectorToggle = () => {
    setShowSelector(!showSelector);
  }
  
  const handleScanButtonClicked = async () => {
    const resp = await window.ipcRenderer.invoke("scan");
    console.log(`Scan success: ${resp.success}`);
  }

  const handleAnalyzeButtonClicked = async () => {
    console.log("Starting analysis with test mode: ", testMode);
    const resp = await window.ipcRenderer.invoke("analyze", testMode, tags);
    if(!resp.success) {
      console.error("Error processing headlines");
    }
    else {
      const resp = await window.ipcRenderer.invoke("fetchAnalysis");
      if(!resp.success) {
        console.error("Failure reading analysis file");
      }
      else {
          const parsingResp = await parseString(resp.data);
          if(!parsingResp.success) {
            console.error("Error parsing analysis file");
          }
          else {
            setTableRows(parsingResp.data);
          }
      }
    }
  }

  const handleReadButtonClicked = async () => {
       const resp = await window.ipcRenderer.invoke("fetchAnalysis");
      if(!resp.success) {
        console.error("Failure reading analysis file");
      }
      else {
          const parsingResp = await parseString(resp.data);
          if(!parsingResp.success) {
            console.error("Error parsing analysis file");
          }
          else {
            setTableRows(parsingResp.data);
          }
      }  
  }

  const handleManualScanRequest = async () => {
    setScanButtonText("Scraping Sites...");
    const scanResp = await window.ipcRenderer.invoke("scan");
    if(!scanResp.success) {
      console.error("Scraping failed");
      return;
    }
    console.log(scanResp);
    setScanButtonText("Analyzing Data...");
    const analysisResp = await window.ipcRenderer.invoke("analyze", testMode, tags);
    if(!analysisResp.success) {
      console.error("Analysis failed");
      return;
    }
    console.log(analysisResp);
    const fetchResp = await window.ipcRenderer.invoke("fetchAnalysis");
    if(!fetchResp.success) {
      console.error("Reading data failed");
      return;
    }
    console.log(fetchResp);
    const parseResp = await parseString(fetchResp.data, fetchResp.timestamp);
    if(!parseResp.success) {
      console.error("Parsing data failed");
      return;
    } 
    setTableRows(parseResp.data);
    setScanButtonText("Run Scan");
  }

  const handleTestModeToggle = () => {
        setTestMode(!testMode);
  }

  //retrieve saved data on startup
  useEffect(() => {
    async function fetchSavedData () {
    const resp = await window.ipcRenderer.invoke("fetchData", "tickers.csv");
    console.log("Data fetched: ", resp.data);
    if(!resp.success)
      await window.ipcRenderer.invoke("saveFile", "tickers.csv", "");
    else
    {
      try {
          const tickers: string[] = resp.data.split(",");
          const validTickers: string[] = tickers.filter((ticker: string) => {
            return (ticker.length > 2)
          })
          setTags(validTickers);
      }
      catch {
        console.error("Failed to split tickers.");
      }
    }

    const fetchResp = await window.ipcRenderer.invoke("fetchAnalysis");
    if(!fetchResp.success) {
      console.error("Failed to read stored analysis");
    }
    
    const parseResp = await parseString(fetchResp.data, fetchResp.timestamp);
    if(!parseResp.success) {
      console.error("Parsing data failed");
      return;
    } 
    setTableRows(parseResp.data)
    }
    fetchSavedData();
  }, [])


return (
  <div className="flex flex-col items-center justify-center">
    <h1 className="mb-4 font-bold text-4xl">Situation Monitor</h1>
    {showSelector && <Selector tags={tags} setTags={setTags} />}
    <Button onClick={handleSelectorToggle} className="my-2">
      {showSelector ? "Hide Selector" : "Show Selector"}
    </Button>

    <div className="flex items-center space-x-2 my-3">
      <Label htmlFor="testmode">Test mode</Label>
      <Switch id="testmode" onClick={handleTestModeToggle}/>
    </div>
    
    <Button size="lg" className="w-38" onClick={handleManualScanRequest}> {scanButtonText} </Button>
    <Button size="sm" onClick={handleReadButtonClicked}> Read </Button>
    <Button size="sm" onClick={handleAnalyzeButtonClicked}> Analyze </Button>
    <div className="container max-w-4xl mx-auto py-10">
      <ResultTable data={tableRows}/>
    </div>
  </div>
);
}

export default App
