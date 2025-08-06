"use client"

import { Row } from "./row"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowDownAZ } from "lucide-react"
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
        <div className="flex items-center ml-1">Analysis <Button variant="ghost" onClick={() => {column.getIsSorted() ? column.clearSorting() : column.toggleSorting(false)}}><ArrowDownAZ/></Button></div>
      )
    },
    cell: ({ row }) => (
      <div className="text-left text-wrap"> {row.getValue("analysis")} </div>
    ),
    enableSorting: true,
    sortingFn: "alphanumeric",
    enableHiding: true
  },
  {
    accessorKey: "timestamp",
    header: () => <div className="text-right">Timestamp</div>,
    cell: ({ row }) => {
      // Convert ISO timestamp to time
      const timestamp: Date = row.getValue("timestamp");
      const formatted: string = timestamp == undefined ? "N/A" : DateTime.fromJSDate(timestamp).toLocal().toFormat("HH:mm:ss");
      
      return <div className="text-right font-medium">{formatted}</div>
    },
    enableSorting: true,
    sortingFn: "datetime",
    enableHiding: true,

  }
]