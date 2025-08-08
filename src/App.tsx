import { useState, useEffect, useRef } from 'react'
import { AppConfig } from 'types/config'
import { Button } from "@/components/ui/button"
import { Selector } from './components/selector/selector'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ResultTable } from '@/components/resulttable/resulttable'
import { parseString } from '@/components/resulttable/parsestring'
import { Row } from "@/components/resulttable/row"
import { useScheduler } from '@/hooks/useScheduler'
import { useStateStore } from '@/store/store'
import './App.css'

function App() {
  const [showSelector, setShowSelector] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [scanButtonText, setScanButtonText] = useState("Run Scan");
  const [tags, setTags] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<Row[]>([]);

  const storeTickers = useStateStore((state) => state.tickers);
  const updateTickers = useStateStore((state) => state.updateTickers);
  const storeTestMode = useStateStore((state) => state.testMode);
  const updateTestMode = useStateStore((state) => state.updateTestMode);
  const storeSecondsRemaining = useStateStore((state) => state.secondsRemaining);

  //use refs to pass current state to hooks - must remember to update refs along with state or hook will break!
  const tagsRef = useRef<string[]>(tags);
  const testModeRef = useRef<boolean>(testMode);

  useEffect(() => {
    tagsRef.current = tags;
  }, [tags]);

  useEffect(() => {
    testModeRef.current = testMode;
  }, [testMode]);

  const {
        startMonitoring,
        scanState,
        secondsRemaining,
        manualScanRequest,
        manualScrapeRequest,
        manualAnalyzeRequest,
        manualReadRequest,
        readRequest,
  } = useScheduler(tagsRef, testModeRef);

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
    setTableRows(parseResp.data);
    }
    fetchSavedData();
  }, []);

  const handleSelectorToggle = () => {
    setShowSelector(!showSelector);
  }

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
      setTableRows(parseResp.data);
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

return (
  <div className="flex flex-col items-center justify-center">
    <h1 className="mb-4 font-bold text-4xl">Situation Monitor</h1>
    {showSelector && <Selector tags={storeTickers} setTags={setTags} />}
    <Button onClick={handleSelectorToggle} className="my-2">
      {showSelector ? "Hide Selector" : "Show Selector"}
    </Button>

    <div className="flex items-center space-x-2 my-3">
      <Label htmlFor="testmode">Test mode</Label>
      <Switch id="testmode" onClick={handleTestModeToggle}/>
    </div>
    
    <Button size="lg" className="w-38" onClick={handleManualScanRequest}> {scanButtonText} </Button>
    <div className="container max-w-4xl mx-auto py-10">
      <ResultTable data={tableRows}/>
    </div>
    <div>Seconds remaining: {storeSecondsRemaining}</div>
  </div>
);
}

export default App
