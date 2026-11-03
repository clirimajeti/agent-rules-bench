// Creates one fresh, isolated copy of the study repo per arm: cloned at the pinned commit, remote removed,
// the arm's setup script applied and committed, and tagged bench-base. Never touches the source repo.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { assertNoClaudeMemoryAbove } from './config.mjs';

const git = (cwd, ...args) => {
  const r = spawnSync('git', ['-c', 'user.email=bench@local', '-c', 'user.name=bench', ...args], { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}: ${(r.stderr || '').trim().split('\n')[0]}`);
  return r.stdout.trim();
};

const inside = (child, parent) => {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

export function copyPath(study, armId) {
  return path.join(study.workdir, armId);
}

const isLocal = (study) => !/^[a-z]+:\/\//.test(study.repo.source) && !study.repo.source.includes('@');

// The URL or absolute path to clone from.
export function repoSource(study) {
  return isLocal(study) ? path.resolve(study.studyDir, study.repo.source) : study.repo.source;
}

export function prepareStudy(study, log = console.log) {
  if (isLocal(study) && inside(study.workdir, repoSource(study))) throw new Error(`workdir ${study.workdir} lies inside the source repo ${repoSource(study)}; pick a workdir outside it`);
  assertNoClaudeMemoryAbove(study.workdir);
  fs.mkdirSync(study.workdir, { recursive: true });
  for (const arm of study.arms) {
    const dest = copyPath(study, arm.id);
    if (fs.existsSync(dest)) {
      const tagged = spawnSync('git', ['rev-parse', '-q', '--verify', 'bench-base'], { cwd: dest }).status === 0;
      if (!tagged) throw new Error(`${dest} exists but was not prepared by agent-rules-bench; remove it yourself and run prepare again`);
      log(`${arm.id}: already prepared at ${dest}, kept as it is`);
      continue;
    }
    git(study.workdir, 'clone', '-q', '--no-hardlinks', repoSource(study), dest);
    git(dest, 'checkout', '-q', '-B', 'bench', study.repo.commit);
    git(dest, 'remote', 'remove', 'origin');
    if (arm.setup) {
      const r = spawnSync('bash', [arm.setup], {
        cwd: dest,
        stdio: ['ignore', 'inherit', 'inherit'],
        env: { ...process.env, BENCH_COPY: dest, BENCH_STUDY_DIR: study.studyDir, BENCH_ARM: arm.id },
      });
      if (r.status !== 0) throw new Error(`setup for arm ${arm.id} (${arm.setup}) exited with ${r.status}; ${dest} is left for inspection`);
    }
    git(dest, 'add', '-A');
    git(dest, 'commit', '-q', '--allow-empty', '-m', `bench: setup for arm ${arm.id}`);
    git(dest, 'tag', '-f', 'bench-base');
    const changed = git(dest, 'diff', '--stat', 'HEAD~1', 'HEAD').split('\n').pop() || 'no tracked changes';
    log(`${arm.id}: prepared at ${dest} (commit ${study.repo.commit}, setup: ${changed.trim()})`);
  }
}
