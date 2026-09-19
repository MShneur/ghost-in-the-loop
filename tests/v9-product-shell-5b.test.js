const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function between(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);if(i<0)throw new Error('missing '+a);return src.slice(i,j<0?undefined:j);}
describe('v9 product shell 5B',()=>{
 test('restores prompt libraries',()=>{for(const id of ['researcher','builder','redteam','devil','tester','customer','executive','roundtable'])expect(src).toContain(id+':{label:');for(const id of ['deep_research','rd_lab','shipyard','debate','pre_mortem','trollproof','lens_relay'])expect(src).toContain(id+':{label:');});
 test('restores three bounded postures',()=>{expect(src).toContain("standard:{label:'Locked'");expect(src).toContain("adaptive:{label:'Adaptive'");expect(src).toContain("audit:{label:'Audit'");});
 test('features only compose prompt text',()=>{const b=between('function promptFeatureText','function bootstrapPrompt');expect(b).not.toContain('sendOnce(');expect(b).not.toContain('setComposerText(');expect(b).not.toContain('.click()');expect(b).not.toContain('requestSubmit');});
 test('canonical sendOnce remains sole send actuator',()=>{const matches=src.match(/button\.click\(\)/g)||[];expect(matches.length).toBe(1);expect(src).toContain('async function sendOnce(text, reason)');});
 test('Workshop import is bounded additive JSON',()=>{expect(src).toContain("const WORKSHOP_SCHEMA = 'gitl-workshop/1'");expect(src).toContain('fileBytes:512*1024');expect(src).toContain('maxItems:100');expect(src).toContain('new Set([...Object.keys(PERSONA_LIBRARY)');expect(src).toContain('new Set([...Object.keys(WORKFLOW_LIBRARY)');expect(src).not.toContain('eval(');});
 test('custom labels render through esc',()=>{expect(src).toContain("'<option value=\"'+esc(id)+'\"");expect(src).toContain("'+esc(p.label)");expect(src).toContain("'+esc(w.label)");});
 test('workflow ownership stays with AI',()=>{expect(src).toContain('You own workflow progress.');expect(src).toContain('Ghost will not interpret or auto-advance them');});
});