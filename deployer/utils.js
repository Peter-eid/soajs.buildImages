'use strict';

const spawn = require('child_process').spawn;
const log = require('util').log;

let utils = {

    /**
     * Function that clones a git repositroy
     * @param  {Object}   options An object that contains params passed to the function
     * @param  {Function} cb      Callback function
     *
     */
    clone(options, cb) {
        let cloneUrl = '';

        if (options.repo.git.owner && options.repo.git.repo) {
            if (options.repo.git.token) {
                log('Cloning from ' + options.repo.git.provider + ' private repository ...');

                if (options.repo.git.provider === 'github') {
                    cloneUrl = `https://${options.repo.git.token}@${options.repo.git.domain}/${options.repo.git.owner}/${options.repo.git.repo}`;
                }
                else if (options.repo.git.provider === 'bitbucket') {
                    if (options.repo.git.domain === 'bitbucket.org') {
                        cloneUrl = `https://x-token-auth${options.repo.git.token}@${options.repo.git.domain}/${options.repo.git.owner}/${options.repo.git.repo}`;
                    }
                    else {
                        cloneUrl = `https://${options.repo.git.token}@${options.repo.git.domain}/scm/${options.repo.git.owner}/${options.repo.git.repo}`;
                    }
                }
            }
            else {
                log('Cloning from ' + options.repo.git.provider + ' public repository ...');
                cloneUrl = `https://${options.repo.git.domain}/${options.repo.git.owner}/${options.repo.git.repo}`;
            }

            log('Cloning in progress ...');
            const clone = spawn('git', [ 'clone', '--branch', options.repo.git.branch, '--depth', '1', cloneUrl, options.clonePath ], { stdio: 'inherit' });

            clone.on('data', (data) => {
                console.log(data.toString());
            });

            clone.on('close', (code) => {
                log(`Cloning repository ${options.repo.git.owner}/${options.repo.git.repo} was successful, exit code: ${code}`);
                return cb();
            });
            clone.on('error', (error) => {
                console.log (`Clone process failed with error: ${error}`);
                throw new Error(error);
            });
        }
        else {
            log('Repository information is missing, skipping ...');
            return cb();
        }
    }

};

module.exports = utils;
