import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';

interface BarcodeLabelProps {
    barcode: string;
    productName: string;
    variantLabel?: string;
    price?: number;
}

export default function BarcodeLabel({ barcode, productName, variantLabel, price }: BarcodeLabelProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, barcode, {
                format: 'CODE128',
                width: 1.5,
                height: 40,
                fontSize: 12,
                margin: 4,
            });
        }
    }, [barcode]);

    return (
        <div className="flex w-48 flex-col items-center border border-dashed border-border p-2 text-center">
            <p className="truncate text-[11px] font-semibold leading-tight">{productName}</p>
            {variantLabel && <p className="truncate text-[10px] text-muted-foreground leading-tight">{variantLabel}</p>}
            <svg ref={svgRef} />
            {price !== undefined && <p className="text-[11px] font-bold">{formatCurrency(price)}</p>}
        </div>
    );
}
