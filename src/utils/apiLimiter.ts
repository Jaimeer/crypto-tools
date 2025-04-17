import Bottleneck from "bottleneck";

const numRequestSec = 1; // Max 5
// Bottleneck configuration: at most 10 calls per second

const singletonLimiter = new Bottleneck({
  minTime: 1000 / numRequestSec,
});

export const limiter = singletonLimiter;
