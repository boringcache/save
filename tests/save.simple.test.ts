import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { run } from '../lib/save-only';
import { mockGetInput, mockGetBooleanInput } from './setup';

describe('Save Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.BORINGCACHE_API_TOKEN;
    

    (exec.exec as jest.Mock).mockResolvedValue(0);
  });

  describe('Workspace Format', () => {
    it('should execute boringcache save with correct arguments', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'node_modules:deps,dist:build',
      });
      mockGetBooleanInput({});
      
      await run();
      

      expect(exec.exec).toHaveBeenCalledWith('boringcache', ['--version'], { 
        ignoreReturnCode: true, 
        silent: true 
      });
      

      expect(exec.exec).toHaveBeenCalledTimes(2);
      expect(exec.exec).toHaveBeenNthCalledWith(2,
        'boringcache',
        ['save', 'my-org/my-project', 'node_modules:deps,dist:build'],
        expect.any(Object)
      );
    });

    it('should use repository name as default workspace', async () => {
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      
      mockGetInput({
        entries: 'node_modules:deps',
      });
      mockGetBooleanInput({});
      
      await run();
      
      expect(exec.exec).toHaveBeenCalledTimes(2);
      expect(exec.exec).toHaveBeenNthCalledWith(2,
        'boringcache',
        ['save', 'owner/repo', 'node_modules:deps'],
        expect.any(Object)
      );
    });
  });

  describe('actions/cache Format', () => {
    it('should convert actions/cache format to workspace format', async () => {
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      
      mockGetInput({
        path: '~/.npm',
        key: 'deps-hash123',
      });
      mockGetBooleanInput({});
      
      await run();
      

      expect(exec.exec).toHaveBeenCalledTimes(2);
      expect(exec.exec).toHaveBeenNthCalledWith(2,
        'boringcache',
        ['save', 'owner/repo', expect.stringMatching(/.*\.npm:deps-hash123/)],
        expect.any(Object)
      );
    });
  });

  describe('Options', () => {
    it('should handle save-always option', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'node_modules:deps',
      });
      mockGetBooleanInput({
        'save-always': true,
      });
      
      await run();
      
      expect(exec.exec).toHaveBeenCalledTimes(2);
      expect(exec.exec).toHaveBeenNthCalledWith(2,
        'boringcache',
        ['save', '--force', 'my-org/my-project', 'node_modules:deps'],
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
        entries: 'node_modules:deps',
      });
      mockGetBooleanInput({});
      

      (exec.exec as jest.Mock)
        .mockImplementation((command: string, args?: string[]) => {
          if (command === 'boringcache' && args?.[0] === '--version') {
            return Promise.resolve(0);
          }
          if (command === 'boringcache' && args?.[0] === 'save') {
            return Promise.resolve(1); // Save failure
          }
          return Promise.resolve(0);
        });
      
      await run();
      

      expect(core.setFailed).not.toHaveBeenCalled();
    });
  });
});