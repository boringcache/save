import * as core from '@actions/core';
import * as fs from 'fs';
import { ensureBoringCache, execBoringCache, validateInputs, parseEntries, getWorkspace, convertCacheFormatToEntries, getPlatformSuffix } from './utils';

export async function run(): Promise<void> {
  try {
    const cliVersion = core.getInput('cli-version') || 'v1.0.0';
    const inputs = {
      workspace: core.getInput('workspace'),
      entries: core.getInput('entries'),
      path: core.getInput('path'),
      key: core.getInput('key'),
      enableCrossOsArchive: core.getBooleanInput('enableCrossOsArchive'),
      enablePlatformSuffix: core.getBooleanInput('enable-platform-suffix'),
      noPlatform: core.getBooleanInput('no-platform'),
      force: core.getBooleanInput('force'),
      verbose: core.getBooleanInput('verbose'),
      exclude: core.getInput('exclude'),
      saveAlways: core.getBooleanInput('save-always'),
    };

    validateInputs(inputs);
    await ensureBoringCache({ version: cliVersion });

    const workspace = getWorkspace(inputs);

    let entriesString: string;
    if (inputs.entries) {
      entriesString = inputs.entries;
    } else {
      entriesString = convertCacheFormatToEntries(inputs, 'save');
    }

    // Determine if we should disable platform suffix
    const shouldDisablePlatform = inputs.enableCrossOsArchive || inputs.noPlatform || !inputs.enablePlatformSuffix;

    await saveCache(workspace, entriesString, {
      force: inputs.force || inputs.saveAlways,
      noPlatform: shouldDisablePlatform,
      verbose: inputs.verbose,
      exclude: inputs.exclude,
    });

  } catch (error) {
    core.setFailed(`Cache save failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface SaveOptions {
  force?: boolean;
  noPlatform?: boolean;
  verbose?: boolean;
  exclude?: string;
}

async function saveCache(workspace: string, entries: string, options: SaveOptions = {}): Promise<void> {
  const entryList = parseEntries(entries, 'save');
  const validEntries: { path: string; tag: string }[] = [];
  const missingPaths: string[] = [];

  for (const entry of entryList) {
    try {
      await fs.promises.access(entry.path);
      core.debug(`Path exists: ${entry.path}`);
      validEntries.push(entry);
    } catch {
      missingPaths.push(entry.path);
      core.debug(`Path not found: ${entry.path}`);
    }
  }

  if (missingPaths.length > 0) {
    core.warning(`Some cache paths do not exist: ${missingPaths.join(', ')}`);
  }

  if (validEntries.length === 0) {
    core.warning('No valid cache paths found, skipping save');
    return;
  }

  core.info(`Saving ${validEntries.length} cache entries to ${workspace}`);

  for (const entry of validEntries) {
    core.info(`Saving: ${entry.path} -> ${entry.tag}`);
    const args = ['save', workspace, `${entry.path}:${entry.tag}`];

    if (options.force) {
      args.push('--force');
    }
    if (options.noPlatform) {
      args.push('--no-platform');
    }
    if (options.verbose) {
      args.push('--verbose');
    }
    if (options.exclude) {
      args.push('--exclude', options.exclude);
    }

    const result = await execBoringCache(args, { ignoreReturnCode: true });

    if (result === 0) {
      core.info(`Saved: ${entry.tag}`);
      core.setOutput('cache-saved', 'true');
    } else {
      core.warning(`Failed to save: ${entry.tag}`);
    }
  }
}

run();
