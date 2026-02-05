import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import { setupBoringCache, validateInputs, parseEntries, getWorkspace, convertCacheFormatToEntries } from './utils';

export async function run(): Promise<void> {
  try {
    const inputs = {
      workspace: core.getInput('workspace'),
      entries: core.getInput('entries'),
      path: core.getInput('path'),
      key: core.getInput('key'),
      enableCrossOsArchive: core.getBooleanInput('enableCrossOsArchive'),
      enablePlatformSuffix: core.getBooleanInput('enable-platform-suffix'),
      saveAlways: core.getBooleanInput('save-always'),
    };

    validateInputs(inputs);
    await setupBoringCache();

    const workspace = getWorkspace(inputs);
    

    let entriesString: string;
    if (inputs.entries) {
      entriesString = inputs.entries;
    } else {

      entriesString = convertCacheFormatToEntries(inputs, 'save');
    }
    
    await saveCache(workspace, entriesString, inputs.saveAlways);

  } catch (error) {
    core.setFailed(`Cache save failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function saveCache(workspace: string, entries: string, saveAlways: boolean = false): Promise<void> {
  const entryList = parseEntries(entries, 'save');
  const validEntries: string[] = [];
  const missingPaths: string[] = [];
  

  for (const entry of entryList) {
    try {
      await fs.promises.access(entry.path); // Use resolved path for existence check
      core.debug(`✅ Path exists: ${entry.path}`);
      // Find original entry format from the entries string
      const originalEntry = entries.split(',').find(e => {
        const [path, tag] = e.split(':');
        return tag === entry.tag;
      });
      if (originalEntry) {
        validEntries.push(originalEntry);
      }
    } catch {
      missingPaths.push(entry.path);
      core.debug(`❌ Path not found: ${entry.path}`);
    }
  }

  if (missingPaths.length > 0) {
    core.warning(`Some cache paths do not exist: ${missingPaths.join(', ')}`);
  }

  if (validEntries.length === 0) {
    core.warning('No valid cache paths found, skipping save');
    return;
  }
  const formattedEntries = validEntries.join(',');
  core.info(`💾 Saving cache entries: ${formattedEntries}`);

  const args = ['save'];
  if (saveAlways) {
    args.push('--force');
  }
  args.push(workspace, formattedEntries);

  const result = await exec.exec('boringcache', args, { ignoreReturnCode: true });

  if (result === 0) {
    core.info(`✅ Successfully saved ${validEntries.length} cache entries`);
  } else {
    core.warning(`⚠️ Failed to save cache entries`);
  }
}

run();