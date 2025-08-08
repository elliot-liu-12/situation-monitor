import { create } from 'zustand'

type State = {
    monitorActive: boolean,
    scanInterval: number,
    secondsRemaining: number,
    testMode: boolean,
    tickers: string[],
    theme: string,
    lastAnalysis: {data: string[], timestamp: Date}
}

type Action = {
    updateScanInterval: (scanInterval: State['scanInterval']) => void,
    updateTestMode: (testMode: State['testMode']) => void,
    updateTickers: (tickers: State['tickers']) => void,
    addTicker: (ticker: string) => void,
    removeTicker: (ticker: string) => void,
    resetTickers: () => void,
    updateSecondsRemaining: (secondsRemaining: State['secondsRemaining']) => void,
    updateMonitorActive: (monitorActive: State['monitorActive']) => void,
    toggleMonitorActive: () => void,
    updateLastAnalysis: (analysis: {data: string[], timestamp: Date}) => void,
}

//Registration format: [name]: ([parameters or state['property']]) => [return type]

export const useStateStore = create<State & Action>((set) => ({
    monitorActive: true,
    scanInterval: 300,
    secondsRemaining: 300,
    testMode: false,
    tickers: [],
    theme: 'light',
    lastCompleted: new Date(Date.now()),
    lastAnalysis: {data: [], timestamp: new Date(Date.now())},
    updateScanInterval: (scanInterval) => { set(() => ({ scanInterval: scanInterval, secondsRemaining: scanInterval }))},
    updateTestMode: (testMode) => set(() => ({ testMode })),
    updateTickers: (tickers) => set(() => ({ tickers })),
    addTicker: (ticker) => set((state) => ({ tickers: [...state.tickers, ticker] })),
    removeTicker: (ticker) => set((state) => ({tickers: state.tickers.filter((elem) => elem !== ticker)})),
    resetTickers: () => set(() => ({tickers: []})),
    updateSecondsRemaining: (secondsRemaining) => set(() => ({ secondsRemaining })),
    updateMonitorActive: (monitorActive) => set(() => ({ monitorActive })),
    toggleMonitorActive: () => set((state) => ({ monitorActive: !state.monitorActive })),
    updateLastAnalysis: (lastAnalysis) => set(() => ({ lastAnalysis })),
}))

//action implementation format: [name]: ([parameter(s)]) => set(([current state if needed]) => {[fieldname]: [new value], [fieldname2]: [newvalue2]...})

