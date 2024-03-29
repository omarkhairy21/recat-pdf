import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import Cropper from 'react-easy-crop';
import { Page, Document, pdfjs } from 'react-pdf';
import Modal from 'react-responsive-modal';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const imageUrl = 'https://picsum.photos/id/237/3000/2000';

const imageBlob = await fetch(imageUrl).then((res) => res.blob())
const imageArrayBuffer = await imageBlob.arrayBuffer();

const productWidth = 800;
const productHeight = 600;
const scale = 1.3;

async function addImageAndGeneratePdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([productWidth, productHeight]);
  const image = await pdfDoc.embedJpg(imageArrayBuffer);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: productWidth,
    height: productHeight,
  });

  const croppedY = 200;

  page.setCropBox(180, croppedY, productWidth, productHeight)
  // persevere the scale
  const newHeight = productHeight - croppedY;
  const heightScale = newHeight / productHeight;
  console.log('heightScale', heightScale)
  // page.scale(1, heightScale);


  const file = await pdfDoc.save();
  const blob = new Blob([file], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

const App = () => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [generatedPdf, setGeneratedPdf] = useState<null | string>(null);
  const [renderedSize, setRenderedSize] = useState({ width: 0, height: 0 });
  const [open, setOpen] = useState(false);



  const handleCropComplete = async (croppedArea, croppedAreaPixels) => {

    const pdfDoc = await PDFDocument.create();

    // add a blank page to the document
    const page = pdfDoc.addPage([productWidth, productHeight]);

    const pdfImage = await pdfDoc.embedJpg(imageArrayBuffer);
 
    const { x, y, width: croppedWidth, height: croppedHeight } = croppedAreaPixels;

    const adjustedY = renderedSize.height - y;


    console.log('croppedArea', croppedArea)
    console.log('croppedAreaPixels', croppedAreaPixels, 'adjustedY', adjustedY)

    // the product is 800x600, and the image is 3000x2000 so we need adjust cropped area to get the exact area
    // we want to crop from the image
    

    page.drawImage(pdfImage, {
      x: 0,
      y: 0,
      width: productWidth,
      height: productHeight,
    });

    await pdfDoc.save();

    // handle the crop area
    // const croppedPdfDoc = await PDFDocument.create();
    // // the page need to keep the same size as the product
    // const croppedPage = croppedPdfDoc.addPage([productWidth, productHeight]);

    // const embeddedPage = await croppedPdfDoc.embedPage(page, {
    //   top: 200,
    //   left: 0,
    //   right: 0,
    //   bottom: 100,
    // });

    // croppedPage.drawPage(embeddedPage, {
    //   x: 0,
    //   y: 0,
    //   width: productWidth,
    //   height: productHeight,
    // });

    // get generated pdf as blob or array buffer 

    const base64 = await pdfDoc.saveAsBase64({ dataUri: true });
    setGeneratedPdf(base64);
  };

  const onOpenModal = () => setOpen(true);
  const onCloseModal = () => setOpen(false);

  useEffect(function loadPdf() {
    addImageAndGeneratePdf().then((pdf) => {
      setGeneratedPdf(pdf);
    });
  }
  , []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      flexDirection: 'column'
    }}
    >
      <div>
        <button onClick={onOpenModal} style={{zIndex: 1000}}>Open Cropper</button>
        {open && (
          <Modal open={open} onClose={onCloseModal} center>
            <button onClick={onCloseModal}>Close Cropper</button>
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onMediaLoaded={(mediaSize) => {
                setRenderedSize(mediaSize);
              }}
              objectFit='contain'
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </Modal>
        )}
      </div>
      <div>
        {generatedPdf && (
          <Document file={generatedPdf}>
            <Page pageNumber={1} width={productWidth} />
          </Document>
        )}
      </div>
    </div>
  );
};

export default App;