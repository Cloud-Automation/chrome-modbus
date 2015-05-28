#!/usr/bin/env node
var cmdline = process.env['CORDOVA_CMDLINE'];
if (!/cca/.test(cmdline)) {
  var msg = 'ERROR: This is a CCA based project! Using `cordova` rather than `cca` will have unexpected results.' ;
  console.error(msg);
  process.exit(1);
}