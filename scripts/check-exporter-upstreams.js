#!/usr/bin/env node
// Read-only upstream revision detector. NO download, install, merge, Actions, credentials or deployment.
'use strict';
const fs=require('fs'),cp=require('child_process'),path=require('path');
const repo=path.resolve(__dirname,'..');
const registry=JSON.parse(fs.readFileSync(path.join(repo,'docs/research/GITL_EXPORTER_UPSTREAMS_20261101.json'),'utf8'));
let changes=0,unknown=0;
for(const source of registry.sources){
  const url='https://github.com/'+source.repo+'.git';
  try{
    const result=cp.spawnSync('git',['ls-remote',url,'HEAD'],{encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']});
    if(result.status!==0)throw Error('Git did not return HEAD');
    const sha=result.stdout.trim().split(/\s+/)[0];
    if(!/^[a-f\d]{40}$/i.test(sha))throw Error('Unexpected HEAD revision');
    const same=sha.startsWith(source.revision)||source.revision.startsWith(sha);
    console.log((same?'UNCHANGED':'REVIEW')+' '+source.repo+' pinned='+source.revision+' upstream='+sha);
    if(!same)changes++;
  }catch(e){unknown++;console.error('UNKNOWN '+source.repo+': '+e.message);}
}
console.log('Upstream review summary: changed='+changes+' unknown='+unknown+' (no code modified).');
process.exitCode=unknown?2:0;
