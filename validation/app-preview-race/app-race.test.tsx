import React, { act } from 'react';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDetail } from '@subject/AppDetail';
import { MobileAppDetail } from '@subject/MobileAppDetail';
import { Renderer } from './stubs';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
function deferred() {
  let resolve!: (value: any) => void;
  const promise = new Promise<any>(r => { resolve = r; });
  return { promise, resolve };
}
const record = (id: string, content = id) => ({ id, title: id, content, sessionKey: `synthetic:${id}` });
let root: ReactTestRenderer | undefined;
afterEach(async () => { if (root) await act(() => root!.unmount()); root = undefined; });
for (const [name, Component] of [['desktop', AppDetail], ['mobile', MobileAppDetail]] as const) {
 describe(name, () => {
  async function setup() {
   const first = deferred(), second = deferred();
   const apps: any = { getApp: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise), invokeTool: vi.fn().mockResolvedValue({}) };
   const render = (id: string, updatedAt = '1') => <Component appId={id} apps={apps} onClose={() => {}} updatedAt={updatedAt} />;
   await act(() => { root = create(render('A')); });
   return { first, second, apps, render };
  }
  it('keeps newer app content and tool session after older app resolves last', async () => {
   const { first, second, apps, render } = await setup();
   await act(() => root!.update(render('B')));
   await act(async () => { second.resolve(record('B')); });
   expect(root!.root.findByType(Renderer).props.response).toBe('B');
   await act(async () => { first.resolve(record('A')); });
   const renderer = root!.root.findByType(Renderer);
   expect(renderer.props.response).toBe('B');
   await act(() => renderer.props.toolProvider.read({ file_path: 'synthetic.txt' }));
   expect(apps.invokeTool).toHaveBeenLastCalledWith('read', { file_path: 'synthetic.txt' }, 'synthetic:B');
  });
  it('does not end the newer loading state when the older response arrives first', async () => {
   const { first, second, render } = await setup();
   await act(() => root!.update(render('B')));
   await act(async () => { first.resolve(record('A')); });
   expect(root!.root.findAllByType(Renderer)).toHaveLength(0);
   expect(JSON.stringify(root!.toJSON())).toContain('Loading app');
   await act(async () => { second.resolve(record('B')); });
   expect(root!.root.findByType(Renderer).props.response).toBe('B');
  });
  it('ignores an obsolete not-found response', async () => {
   const { first, second, render } = await setup();
   await act(() => root!.update(render('B')));
   await act(async () => { second.resolve(record('B')); });
   await act(async () => { first.resolve(null); });
   expect(root!.root.findByType(Renderer).props.response).toBe('B');
  });
  it('keeps the newer generated UI version for the same app', async () => {
   const { first, second, render } = await setup();
   await act(() => root!.update(render('A', '2')));
   await act(async () => { second.resolve(record('A', 'new UI')); });
   await act(async () => { first.resolve(record('A', 'old UI')); });
   expect(root!.root.findByType(Renderer).props.response).toBe('new UI');
  });
  it('keeps tool calls scoped to the current app independently of content assertions', async () => {
   const { first, second, apps, render } = await setup();
   await act(() => root!.update(render('B')));
   await act(async () => { second.resolve(record('B')); });
   await act(async () => { first.resolve(record('A')); });
   await act(() => root!.root.findByType(Renderer).props.toolProvider.read({ file_path: 'synthetic.txt' }));
   expect(apps.invokeTool).toHaveBeenLastCalledWith('read', { file_path: 'synthetic.txt' }, 'synthetic:B');
  });
  it('handles StrictMode effect replay without accepting the first request', async () => {
   const first = deferred(), second = deferred();
   const apps: any = { getApp: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise), invokeTool: vi.fn() };
   await act(() => { root = create(<React.StrictMode><Component appId="A" apps={apps} onClose={() => {}} /></React.StrictMode>); });
   expect(apps.getApp).toHaveBeenCalledTimes(2);
   await act(async () => { second.resolve(record('A', 'new UI')); });
   await act(async () => { first.resolve(record('A', 'obsolete UI')); });
   expect(root!.root.findByType(Renderer).props.response).toBe('new UI');
  });
  it('still shows not found for the current app', async () => {
   const { first } = await setup();
   await act(async () => { first.resolve(null); });
   expect(root!.root.findAllByType(Renderer)).toHaveLength(0);
   expect(JSON.stringify(root!.toJSON())).toContain('App not found');
  });
  it('still loads a single request normally', async () => {
   const { first } = await setup();
   await act(async () => { first.resolve(record('A')); });
   expect(root!.root.findByType(Renderer).props.response).toBe('A');
  });
 });
}
