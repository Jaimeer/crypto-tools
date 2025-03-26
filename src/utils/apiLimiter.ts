import Bottleneck from 'bottleneck'

const numRequestSec = 5 - 1
// Bottleneck configuration: at most 10 calls per second
export const limiter = new Bottleneck({
  minTime: 1000 / numRequestSec,
})
