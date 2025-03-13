import { TaskQueue } from './fiber';

it('test fiber', (done) => {
  const queue = new TaskQueue();
  const job = jest.fn(() => console.log('called'));

  queue.schedule(job);
  queue.schedule(() => {
    expect(job).toHaveBeenCalled();
    queue.close();
    done();
  });
});
