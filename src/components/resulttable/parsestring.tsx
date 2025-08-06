import { Row } from "./row";
export const parseString = (input: string[], timestamp?: Date): { success: boolean; data: Row[] } => {
    try {
        const rows: Row[] = input.map((line) => {
                const trimmedLine = line.trim();
                return {
                    id: "0",
                    analysis: trimmedLine,
                    timestamp: timestamp
                }
        });
        return { success: true, data: rows };
    } catch (err) {
        console.error("Error parsing analysis data: ", err);
        return { success: false, data: [] };
    }
};