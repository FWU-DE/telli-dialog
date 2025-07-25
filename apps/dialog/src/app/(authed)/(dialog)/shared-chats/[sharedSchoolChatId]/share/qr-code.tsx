'use client';

import { QRCodeSVG } from 'qrcode.react';

type QRCodeProps = React.ComponentProps<typeof QRCodeSVG>;

export default function QRCode(props: QRCodeProps) {
  return <QRCodeSVG {...props} />;
}
