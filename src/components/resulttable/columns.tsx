"use client"

import { Row } from "./row"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from "lucide-react"
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react"
import { DateTime } from "luxon";


export const Columns: ColumnDef<Row>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "analysis",
    header: ({column}) => {
      return (
        <div className="flex items-center ml-1">Analysis 
          <Button variant="ghost" onClick={() => {column.toggleSorting()}}>
            {column.getNextSortingOrder() === "desc" ? <ArrowUpDown/> : column.getNextSortingOrder() === "asc" ? <ArrowUpAZ/> : <ArrowDownAZ/>}
          </Button>
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="text-left text-wrap"> {row.getValue("analysis")} </div>
    ),
    enableSorting: true,
    sortDescFirst: true,
    sortingFn: "alphanumeric",
    enableHiding: true
  },
  {
    accessorKey: "timestamp",
    header: ({column}) => {
      return (
        <div className="flex items-center justify-end">
          Time
        <Button variant="ghost" onClick={() => {column.toggleSorting()}}>{column.getNextSortingOrder() === "asc" ? <ChevronsUpDown/>: column.getNextSortingOrder() === "desc" ? <ChevronUp/> : <ChevronDown/>}</Button>
        </div>
      )
    },
    cell: ({ row }) => {
      // Convert ISO timestamp to time
      const timestamp: Date = row.getValue("timestamp");
      // Format time
      const formatTime = (ts: Date): string => {
        const msInDay = 8.64e+7;
        //display time if less than a day
        if(Date.now() - ts.getTime() < msInDay) {
          return DateTime.fromJSDate(ts).toLocaleString(DateTime.TIME_SIMPLE);
        }
        //display date and time if less than a week
        else if(ts.getTime() - ts.getTime() < (msInDay * 7)) {
          return DateTime.fromJSDate(ts).toLocaleString(DateTime.DATETIME_SHORT);
        }
        //otherwise display date
        else {
          return DateTime.fromJSDate(timestamp).toLocaleString(DateTime.DATE_FULL);
        }
      }
      const formatted: string = timestamp == undefined ? "N/A" : formatTime(timestamp);
      
      return <div className="text-right font-medium">{formatted}</div>
    },
    enableSorting: true,
    sortDescFirst: false,
    sortingFn: "datetime",
    enableHiding: true,

  }
]