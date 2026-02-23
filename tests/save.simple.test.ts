import * as core from '@actions/core';
import { execBoringCache, ensureBoringCache } from '@boringcache/action-core';
import { run } from '../lib/save-only';
import { mockGetInput, mockGetBooleanInput } from './setup';

describe('Save Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.BORINGCACHE_API_TOKEN;

    (execBoringCache as jest.Mock).mockResolvedValue(0);
    (ensureBoringCache as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Workspace Format', () => {
    it('should execute boringcache save with correct arguments', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules,build:dist',
      });
      mockGetBooleanInput({});

      await run();

      expect(ensureBoringCache).toHaveBeenCalledWith({ version: 'v1.5.0' });

      // Now passes all entries as single string to CLI
      expect(execBoringCache).toHaveBeenCalledTimes(1);
      expect(execBoringCache).toHaveBeenCalledWith(
        ['save', 'my-org/my-project', 'deps:node_modules,build:dist'],
      );
    });

    it('should use repository name as default workspace', async () => {
      process.env.GITHUB_REPOSITORY = 'owner/repo';

      mockGetInput({
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({});

      await run();

      expect(execBoringCache).toHaveBeenCalledTimes(1);
      expect(execBoringCache).toHaveBeenCalledWith(
        ['save', 'owner/repo', 'deps:node_modules'],
      );
    });
  });

  describe('actions/cache Format', () => {
    it('should convert actions/cache format to tag:path format', async () => {
      process.env.GITHUB_REPOSITORY = 'owner/repo';

      mockGetInput({
        path: '~/.npm',
        key: 'deps-hash123',
      });
      mockGetBooleanInput({});

      await run();

      expect(execBoringCache).toHaveBeenCalledTimes(1);
      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining(['save', 'owner/repo', expect.stringMatching(/^deps-hash123.*:.*\.npm$/)]),
      );
    });
  });

  describe('Options', () => {
    it('should handle save-always option', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({
        'save-always': true,
      });

      await run();

      expect(execBoringCache).toHaveBeenCalledTimes(1);
      expect(execBoringCache).toHaveBeenCalledWith(
        ['save', 'my-org/my-project', 'deps:node_modules', '--force'],
      );
    });

    it('should pass --force when force is true', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({ force: true });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        ['save', 'my-org/my-project', 'deps:node_modules', '--force'],
      );
    });

    it('should pass --no-platform when no-platform is true', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({ 'no-platform': true });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        ['save', 'my-org/my-project', 'deps:node_modules', '--no-platform'],
      );
    });

    it('should pass --no-platform when enableCrossOsArchive is true', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({ enableCrossOsArchive: true });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        ['save', 'my-org/my-project', 'deps:node_modules', '--no-platform'],
      );
    });

    it('should pass --verbose when verbose is true', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({ verbose: true });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        ['save', 'my-org/my-project', 'deps:node_modules', '--verbose'],
      );
    });

    it('should pass --exclude when exclude is set', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
        exclude: '*.log',
      });
      mockGetBooleanInput({});

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        ['save', 'my-org/my-project', 'deps:node_modules', '--exclude', '*.log'],
      );
    });

    it('should pass all flags together', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
        exclude: '*.tmp',
      });
      mockGetBooleanInput({
        force: true,
        'no-platform': true,
        verbose: true,
      });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        ['save', 'my-org/my-project', 'deps:node_modules', '--force', '--no-platform', '--verbose', '--exclude', '*.tmp'],
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid inputs gracefully', async () => {
      mockGetInput({}); // No inputs
      mockGetBooleanInput({});

      await run();

      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('Either (workspace + entries) or (path + key) inputs are required')
      );
    });

    it('should handle save failure gracefully', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({});

      (execBoringCache as jest.Mock).mockRejectedValue(new Error('save failed'));

      await run();

      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('save failed')
      );
    });
  });
});
