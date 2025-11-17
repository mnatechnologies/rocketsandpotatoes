import { NextRequest, NextResponse} from "next/server";
import {fetchMetalsQuotes, type MetalSymbol} from "@/lib/metals-api/metalsApi";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const symbolsParam = searchParams.get('symbol')
        const baseCurrency = searchParams.get('baseCurrency') || 'AUD';

        const symbols = symbolsParam ? symbolsParam.split(',') as MetalSymbol[] : undefined;

        const quotes = await fetchMetalsQuotes({symbols, baseCurrency})

        const dataTimeStamp = quotes[0]?.timestamp

        return NextResponse.json({success: true, data: quotes, timestamp: dataTimeStamp});
    } catch (error) {
        console.error('Error fetching metals quotes:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        },
        {status: 500}
        );
    }
}