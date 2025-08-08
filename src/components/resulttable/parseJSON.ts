import { Row } from "./row"

interface RawObj {
    id: string,
    analysis: string,
    timestamp: string,

}
export const parseJSON = async (rawJSON: string): Promise<{success: boolean, data: Row[]}> => {
    try {
        const objectArray: RawObj[] = await JSON.parse(rawJSON);
        //convert string timestamp back into object
        const rowData: Row[] = objectArray.map((obj) => {
            return {
                id: obj.id,
                analysis: obj.analysis,
                timestamp: new Date(obj.timestamp),
            }
        })
        return {success: true, data: rowData};
    } catch (error) {
        console.error(error);
        return {success: false, data: []}
    }
}