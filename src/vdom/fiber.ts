import { LinkedQueue } from '@/utils';

export type Task = () => void;

export class TaskQueue {
  tasks: LinkedQueue<Task>;

  readonly frameLimit: number;

  private channel:MessageChannel;

  constructor(frameLimit = 1000 / 60) {
    this.tasks = new LinkedQueue<Task>();
    this.frameLimit = frameLimit;
    this.channel = new MessageChannel();

    this.channel.port1.onmessage = () => this.flushTask();
  }

  // enqueue and flush
  schedule(task: Task) {
    this.tasks.enqueue(task);

    if (task === this.tasks.head) {
      this.flushTask();
    }
  }

  protected flushTask() {
    const start = performance.now();

    while (true) {
      const pending = this.tasks.head;

      if (!pending) break;

      try {
        pending();
        this.tasks.dequeue();
      } catch (e) {
        console.error(e); // TODO
      }

      const elapsed = performance.now() - start;

      if (elapsed >= this.frameLimit) {
      // shedule next loop
        this.channel.port2.postMessage('');
        break;
      }
    }
  }

  close() {
    this.channel.port1.close();
    this.channel.port2.close();
  }
}
