import { useState, useEffect, useRef, useCallback } from 'react';
import { AppConfig } from 'types/config'
import { useStateStore } from '@/store/store'

// this hook centralizes the scan state so that other components know that a scan is ongoing and can dispatch events and get the time between scans
export const useScheduler = () => {
    const [ scanState, setScanState ] = useState<"idle" | "scraping" | "analysis" | "reading">("idle");
    const interval = useRef<NodeJS.Timeout | null>(null);
    const { testMode, tickers, updateLastCompleted, updateLastAnalysis } = useStateStore();
    // fetch default value from config file
    useEffect(() => {
        async function fetchSavedData() {
            const configResp = await window.ipcRenderer.invoke("loadConfig");
            const store = useStateStore.getState();
            const updateScanInterval = store.updateScanInterval;

            if(configResp.success) {
                updateScanInterval(configResp.data.scanInterval);
            } else
            {
                console.error("Failed to read saved scan interval, setting to sensible default");
                updateScanInterval(300);
            }
        }
        fetchSavedData();
    }, []);

    const fullScanCallback = useCallback(async () => {
        if(scanState != "idle") {
            console.error("Attempted to interrupt ongoing scan");
            return;
        }
        console.time("full-scan");
        setScanState("scraping");
        const scrapeResp = await scrapeRequest();
        if(!scrapeResp.success) {
        return {success: false, state: scanState, data: [], timestamp: new Date(0)};
        }

        setScanState("analysis");
        const analysisResp = await analyzeRequest(testMode, tickers);
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
        updateLastCompleted(readResp.timestamp);
        updateLastAnalysis(readResp.data);
        return {success: true, state: scanState, data: readResp.data, timestamp: readResp.timestamp};
    }, [scanState, testMode, tickers, updateLastCompleted, updateLastAnalysis])
 
    //start timer
    useEffect(() => {
        if(interval.current == null) {
            interval.current = setInterval(() => {
                const store = useStateStore.getState();
                const isActive = store.monitorActive;
                if(isActive) {
                    const currTime = store.secondsRemaining - 1;
                    store.updateSecondsRemaining(currTime);
                    if (currTime <= 0) {
                        fullScanCallback();
                        const scanInterval = store.scanInterval;
                        store.updateSecondsRemaining(scanInterval);
                    }
                }
            }, 1000);
        }
        
    return () => {
        if (interval.current) {
            clearInterval(interval.current);
            interval.current = null;
        }
    };
    }, [fullScanCallback]);

    const fullScan = async (): Promise<{success: boolean, state: string, data: string[], timestamp: Date}> => {
    console.time("full-scan");
    setScanState("scraping");
    const scrapeResp = await scrapeRequest();
    if(!scrapeResp.success) {
      return {success: false, state: scanState, data: [], timestamp: new Date(0)};
    }

    setScanState("analysis");
    const analysisResp = await analyzeRequest(useStateStore.getState().testMode, useStateStore.getState().tickers);
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
    
    const manualScanRequest = async (): Promise<{success: boolean, data: string[], timestamp: Date}> => {
        if(scanState == "idle") {
            const resp = await fullScan();
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
        manualScanRequest,
        manualScrapeRequest,
        manualAnalyzeRequest,
        manualReadRequest,
        readRequest,
    }
}