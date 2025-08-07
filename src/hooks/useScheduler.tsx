import { useState, useEffect } from 'react';


// this hook centralizes the scan state so that other components know that a scan is ongoing and can dispatch events and get the time between scans
export const useScheduler = () => {
    const [ scanState, setScanState ] = useState<"idle" | "scraping" | "analysis" | "reading">("idle");
    const [ scanInterval, setScanInterval ] = useState<number>(300);
    const [ secondsRemaining, setSecondsRemaining ] = useState<number>(300);

    useEffect(() => {

    },[scanInterval])

    const getScanInterval = (): number => {
        return scanInterval;
    }

    const fullScan = async (testMode: boolean, tags: string[]): Promise<{success: boolean, state: string, data: string[], timestamp: Date}> => {
    console.time("full-scan");
    setScanState("scraping");
    const scrapeResp = await scrapeRequest();
    if(!scrapeResp.success) {
      return {success: false, state: scanState, data: [], timestamp: new Date(0)};
    }

    setScanState("analysis");
    const analysisResp = await analyzeRequest(testMode, tags);
    if(!analysisResp.success) {
      return {success: false, state: scanState, data: [], timestamp: new Date(0)};
    }

    setScanState("reading");
    const readResp = await readRequest();
    if(!readResp.success) {
        console.log("Reading data failed");
        return {success: false, state: scanState, data: [], timestamp: new Date(0)};
    }

    setScanState("idle");
    console.timeEnd("full-scan");
    return {success: true, state: scanState, data: readResp.data, timestamp: readResp.timestamp};
    }
    
    const manualScanRequest = async (testMode: boolean, tags: string[]): Promise<{success: boolean, data: string[], timestamp: Date}> => {
        if(scanState == "idle") {
            const resp = await fullScan(testMode, tags);
            return {success: resp.success, data: resp.data, timestamp: resp.timestamp};
        }
        else {
            return {success: false, data: [], timestamp: new Date(0)};
        }
    }

    const scrapeRequest = async (): Promise<{success: boolean}> => {
        const resp = await window.ipcRenderer.invoke("scan");
        if(!resp.success) {
        console.error("Scraping failed");
        return {success: false};
        }
        return {success: true};
    }

    const analyzeRequest = async (testMode: boolean, portfolio: string[]): Promise<{success: boolean}> => {
        const resp = await window.ipcRenderer.invoke("analyze", testMode, portfolio);
        if(!resp.success) {
          console.error("Analysis failed");
          return {success: false};
        }
        return {success: true};
    }

    const readRequest = async (): Promise<{success: boolean, data: string[], timestamp: Date}> => {
        const resp = await window.ipcRenderer.invoke("fetchAnalysis");
        if(!resp.success) {
            console.log("Reading data failed");
            return {success: false, data: [], timestamp: new Date(0)};
        }
        else {
            return {success: true, data: resp.data, timestamp: resp.timestamp};
        }
    }


    //individual steps for debugging
    const manualScrapeRequest = async () => {
        if(scanState == "idle") {
            const resp = await scrapeRequest();
            console.log(resp);
        }
    }

    const manualAnalyzeRequest = async (testMode: boolean, portfolio: string[]) => {
        if(scanState == "idle"){
            const resp = await analyzeRequest(testMode, portfolio);
            console.log(resp);
        }
    }

    const manualReadRequest = async () => {
        if(scanState == "idle"){
            const resp = await readRequest();
            console.log(resp);
        }
    }

    return {
        scanState,
        getScanInterval,
        manualScanRequest,
        manualScrapeRequest,
        manualAnalyzeRequest,
        manualReadRequest,
        readRequest,
        setScanInterval,
        fullScan,
    }
}