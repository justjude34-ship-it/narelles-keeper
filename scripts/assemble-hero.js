const fs=require("fs");
const path=require("path");
const a=path.join(__dirname,"hero-b64-r003a.txt");
const b=path.join(__dirname,"hero-b64-r003b.txt");
if(fs.existsSync(a)&&fs.existsSync(b)){
  fs.writeFileSync(path.join(__dirname,"hero-b64-r003.txt"),
    fs.readFileSync(a,"utf8").replace(/\s+/g,"")+fs.readFileSync(b,"utf8").replace(/\s+/g,""));
}
const parts=[];
const n=240;
for (let i=0;i<n;i++) {
  const f=path.join(__dirname, `hero-b64-s${String(i).padStart(3,"0")}.txt`);
  parts.push(fs.readFileSync(f,"utf8").replace(/\s+/g,""));
}
const buf=Buffer.from(parts.join(""),"base64");
const out=path.join(__dirname,"..","assets","hero-lotus-cool.jpg");
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,buf);
console.log("wrote",out,buf.length);
