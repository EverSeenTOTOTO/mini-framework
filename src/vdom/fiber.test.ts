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

it('test fiber, priority', (done) => {
  const queue = new TaskQueue();
  const job = jest.fn(() => console.log('called'));

  queue.enqueue(() => {
    expect(job).toHaveBeenCalled();
    queue.close();
    done();
  });
  queue.schedule({ job, priority: 0 });
});
