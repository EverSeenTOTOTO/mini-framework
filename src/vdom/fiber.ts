import { PriorHeap } from '@/utils';

export type Task = {
  priority: number;
  job: () => void
};

export class TaskQueue {
  tasks: PriorHeap<Task>;

  readonly frameLimit: number;

  private channel:MessageChannel;

  private running = false;

  constructor(frameLimit = 1000 / 60) {
    this.tasks = new PriorHeap<Task>([], (a, b) => a.priority < b.priority);
    this.frameLimit = frameLimit;
    this.channel = new MessageChannel();

    this.channel.port1.onmessage = () => {
      if (this.running) return;
      this.running = true;

      const start = Date.now();

      while (true) {
        const top = this.tasks.pop();

        if (!top) {
          this.running = false;
          break;
        }

        try {
          top.job();
        } catch {
          // TODO
        }

        if (this.tasks.length === 0) {
          this.running = false;
          break;
        }

        const elapsed = (Date.now() - start) / 1000;

        if (elapsed >= this.frameLimit) {
          // shedule next loop
          this.channel.port2.postMessage('');
          this.running = false;
          break;
        }
      }
    };
  }

  schedule(task: Task['job']):void;
  schedule(task: Task):void;
  schedule(task: any) {
    if (typeof task === 'function') {
      this.tasks.push({ job: task, priority: /* lowest */ this.tasks.length });
    } else {
      this.tasks.push(task);
    }
  }

  start() {
    if (!this.running) {
      this.channel.port2.postMessage('');
    }
  }

  close() {
    this.channel.port1.close();
    this.channel.port2.close();
    this.tasks.clear();
  }
}
