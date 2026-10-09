// Offline fallback: requires globally installed TypeScript (tsc).
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const {stampManifest} = require('./stamp-manifest.cjs');
const root = path.resolve(__dirname, '..');
const globalNodeModules = cp.execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim();
const ts = require(path.join(globalNodeModules,'typescript'));
fs.rmSync(path.join(root,'dist'),{recursive:true,force:true});
fs.cpSync(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
stampManifest(root);
let settings = fs.readFileSync(path.join(root,'src/settings.ts'),'utf8').replace(/\bexport\s+/g,'');
for (const name of ['content','popup']) {
 let source = fs.readFileSync(path.join(root,'src',name+'.ts'),'utf8').replace(/^import .* from '\.\/settings';\n/m,'');
 let code = ts.transpileModule(`${settings}\n${source}`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 fs.writeFileSync(path.join(root,'dist',name+'.js'),`(()=>{\n${code}\n})();\n`);
}
console.log('Built offline dist/');
