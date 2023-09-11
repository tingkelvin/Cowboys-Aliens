<p align="center">
  <img src="[http://some_place.com/image.png](https://github.com/tingkelvin/Cowboys-Aliens/assets/49113121/98b5756a-9656-449e-b61b-c8bb7a14b95f)" />
</p>

### Backgrounds

Those who watched the Tokyo 2020 Olympics would have likely observed the nearly 2,000-strong drone swarm
lightshow during the opening ceremony which produced some spectacular 3D images. Controlling such a large
number of drones to be in specific places at specific times is more difficult and less reliable using traditional “central
processing station” methods. Instead, ease of implementation and reliability of the swarm scales better when the
drones can compute and communicate locally to converge to a desired global (swarm) behaviour. This method is
known as distributed decision-making.

Traditional decision-making architectures for agent-based population are centralised, achieving complex tasks by
piping information from all agents to a common processing centre from which actions are then delegated to each
agent (Figure 1A). Whilst this architecture is relatively simple and allows for relatively fast decision-making, it is
fragile with the entire population’s capability relying solely on the operation of the common processing centre. In
the real-world, the operation of the common processing centre is not guaranteed and thus it is desirable to utilise
a decision-making architecture that has greater redundancy. A distributed decision-making architecture allows a
population (tens or hundreds) of agents to achieve global goals via local communication to their neighbours (Figure
1B). This removes the requirement for a common processing centre and instead relies on neighbouring nodes
communicating locally to find consensus on a set of actions that will achieve a global goal. Therefore, the loss of
any single agent in the distributed network has a negligible impact on the global decision-making capability of the
population.

![Screenshot 2023-09-11 at 10 51 25 pm](https://github.com/tingkelvin/Cowboys-Aliens/assets/49113121/60a54159-30b8-4abc-a7d5-5a1485ad121c)

### Objectives
2  decision-making algorithm and its stimulation. We created a user interface that allow user to compare the effectiveness and efficiency of the algorithm under different scenarios configured by a user. Our implementation compare the effectiveness on leader election, since we implemented PAXOS and raft and they both have a different leader election aglorthm. We did not address the issues of clock synchronmiazation and spanning tree construction that mentioned in initial report. Secondly, we focus more on the stimulation because we believe that the stimulation will create a virtua comparison that user might want to see. Moreover, this project's overarching objective is to learn about software engineering principles through the creation of a software system that can test and compare various distributed decision-making processes. 
