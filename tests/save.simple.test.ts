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

      expect(ensureBoringCache).toHaveBeenCalledWith({ version: 'v1.0.0' });

      expect(execBoringCache).toHaveBeenCalledTimes(2);
      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining(['save', 'my-org/my-project', expect.stringMatching(/^deps:.*node_modules$/)]),
        expect.any(Object)
      );
      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining(['save', 'my-org/my-project', expect.stringMatching(/^build:.*dist$/)]),
        expect.any(Object)
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
        expect.arrayContaining(['save', 'owner/repo']),
        expect.any(Object)
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
        expect.any(Object)
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
        expect.arrayContaining(['save', 'my-org/my-project', expect.stringMatching(/^deps:/), '--force']),
        expect.any(Object)
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

      (execBoringCache as jest.Mock).mockResolvedValue(1);

      await run();

      expect(core.setFailed).not.toHaveBeenCalled();
    });
  });
});
