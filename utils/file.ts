export async function fileToBase64(file: File){
const buf = await file.arrayBuffer()
const bytes = new Uint8Array(buf)
let binary = ''
for (let i=0;i<bytes.length;i++) binary += String.fromCharCode(bytes[i])
return btoa(binary) // 純base64で返す
}