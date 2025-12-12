// We declare the global variable because we loaded mammoth via CDN in index.html
declare const mammoth: any;

export const parseDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      const arrayBuffer = event.target?.result;
      
      if (!arrayBuffer) {
        reject(new Error("Failed to read file"));
        return;
      }

      // Using mammoth to extract raw text
      mammoth.extractRawText({ arrayBuffer: arrayBuffer })
        .then((result: any) => {
          resolve(result.value); // The raw text
        })
        .catch((err: any) => {
          console.error("Mammoth error:", err);
          reject(new Error("Failed to parse Word document"));
        });
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};