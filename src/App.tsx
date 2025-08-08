import { useState, useEffect, useRef } from 'react'
import { AppConfig } from 'types/config'
import { Button } from "@/components/ui/button"
import { Selector } from './components/selector/selector'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ResultTable } from '@/components/resulttable/resulttable'
import { parseString } from '@/components/resulttable/parseStringArray'
import { parseJSON } from '@/components/resulttable/parseJSON'
import { Row } from "@/components/resulttable/row"
import { useScheduler } from '@/hooks/useScheduler'
import { useStateStore } from '@/store/store'
import './App.css'

function App() {
  const [showSelector, setShowSelector] = useState(true);
  const [scanButtonText, setScanButtonText] = useState("Run Scan");
  const [tableRows, setTableRows] = useState<Row[]>([]);

  const storeTickers = useStateStore((state) => state.tickers);
  const updateTickers = useStateStore((state) => state.updateTickers);
  const storeTestMode = useStateStore((state) => state.testMode);
  const updateTestMode = useStateStore((state) => state.updateTestMode);
  const storeSecondsRemaining = useStateStore((state) => state.secondsRemaining);
  const { addTicker, removeTicker, resetTickers, lastAnalysis, toggleMonitorActive } = useStateStore(); 

  const {
        scanState,
        manualScanRequest,
  } = useScheduler();

  //retrieve saved data on startup
  useEffect(() => {
    async function fetchSavedData () {
    const tickersResp = await window.ipcRenderer.invoke("fetchData", "tickers.csv");
    console.log("Data fetched: ", tickersResp.data);
    if(!tickersResp.success)
      await window.ipcRenderer.invoke("saveFile", "tickers.csv", "");
    else
    {
      try {
          const tickers: string[] = tickersResp.data.split(",");
          const validTickers: string[] = tickers.filter((ticker: string) => {
            return (ticker.length > 2)
          })
          updateTickers(validTickers);
      }
      catch {
        console.error("Failed to split tickers.");
      }
    }
    const fetchResp = await window.ipcRenderer.invoke("fetchData", "analysis.json");
    if(!fetchResp.success) {
      console.error("Failed to read stored analysis");
    }
    
    const parseResp = await parseJSON(fetchResp.data);
    if(!parseResp.success) {
      console.error("Parsing data failed");
      return;
    } 
    setTableRows(parseResp.data);
    }
    fetchSavedData();
  }, [updateTickers]);

  // update table when scan is complete
  useEffect(() => {
    async function parseUpdate() {
      const parseResp = await parseString(lastAnalysis.data, lastAnalysis.timestamp);
      if(!parseResp.success) {
        console.error("Parsing data failed");
        return;
      } 
      setTableRows(prevRows => [...parseResp.data, ...prevRows]);
    }
    parseUpdate();
  }, [lastAnalysis]);

  const handleSelectorToggle = () => {
    setShowSelector(!showSelector);
  }

  // code for "Run Scan button"
  const handleManualScanRequest = async () => {
    const resp = await manualScanRequest();
    if(!resp.success) {
      console.error("Failed to manually start scan");
    }
    else {
      const parseResp = await parseString(resp.data, resp.timestamp);
      if(!parseResp.success) {
        console.error("Failed to parse analysis output");
      }
      setTableRows([...parseResp.data, ...tableRows]);
    }
  }

  //Changes button text based on hook state
  useEffect(() => {
    switch(scanState){
      case "idle":
        setScanButtonText("Run Scan");
      break;
      case "scraping":
        setScanButtonText("Scraping sites...");
      break;
      case "analysis":
        setScanButtonText("Analyzing headlines...");
      break;
      case "reading":
        setScanButtonText("Analyzing headlines...");
      break;
      default:
        setScanButtonText("Unknown error");
        console.error("Scan state unknown");
    }
  }, [scanState])

  const handleTestModeToggle = () => {
        updateTestMode(!storeTestMode);
  }

  const handleMonitorToggle = () => {
    toggleMonitorActive();
  }

  const handleSaveTable = async () => {
    const tableString: string = JSON.stringify(tableRows);
    const saveResp = await window.ipcRenderer.invoke("saveFile", "analysis.json", tableString);
    if(!saveResp.success) {
      console.error("Table could not be saved!");
    }
  }

  const handleClearData = async () => {
    const emptyList: Row[] = [];
    const listString: string = JSON.stringify(emptyList);
    const saveResp = await window.ipcRenderer.invoke("saveFile", "analysis.json", listString);
    if(!saveResp.success) {
      console.error("Table could not be cleared!");
    }
  }

return (
  <div className="flex flex-col items-center justify-center">
    <h1 className="mb-4 font-bold text-4xl">Situation Monitor</h1>
    {showSelector && <Selector tags={storeTickers} addTicker={addTicker} removeTicker={removeTicker} resetTickers={resetTickers} />}
    <Button onClick={handleSelectorToggle} variant="ghost" className="my-2">
      {showSelector ? "Hide Selector" : "Show Selector"}
    </Button>
    
    <Button size="lg" className="w-38" onClick={handleManualScanRequest}> {scanButtonText} </Button>
    <div className="my-2">Seconds remaining: {storeSecondsRemaining}</div>

    <div className="flex items-center space-x-2 my-1.5">
      <Label htmlFor="testmode">Monitor Automatically</Label>
      <Switch id="testmode" onClick={handleMonitorToggle} defaultChecked={true}/>
    </div>

    <div className="flex items-center space-x-2 my-1.5">
      <Label htmlFor="testmode">Test mode</Label>
      <Switch id="testmode" onClick={handleTestModeToggle}/>
    </div>

    <div className="container max-w-4xl mx-auto py-10">
      <ResultTable data={tableRows}/>
      <Button variant="ghost" onClick={handleSaveTable}>Save Table</Button>
      <Button variant="ghost" onClick={handleClearData}>Clear Saved Data</Button>
    </div>
    
  </div>
);
}

export default App
