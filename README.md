<p align="center">
  <img src="https://github.com/tingkelvin/Cowboys-Aliens/assets/49113121/98b5756a-9656-449e-b61b-c8bb7a14b95f" />
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

<p align="center">
  <img src="https://github.com/tingkelvin/Cowboys-Aliens/assets/49113121/60a54159-30b8-4abc-a7d5-5a1485ad121c" />
</p>

### Objectives

The overarching aims of this project are to learn about software engineering practices through the development of
a software system that can test and compare different methods of distributed decision-making. Furthermore, there
are three key objectives of this project:

1. Create a software system for testing distributed decision-making methods.
2. Experiment with different distributed decision-making methods.
3. Compare the effectiveness of each method.
4. Implemneted 2 distributed aglorithm: Paxos and Raft
5. Developed an user interface that allow user to tweak with different parameters.

### User Interface
<p align="center">
  <img src="https://github.com/tingkelvin/Cowboys-Aliens/assets/49113121/29e879f1-fe74-419e-bddc-108efe2966af" />
</p>

### Demo

Create 2D grid to stimulate invasion of aliens, messages passing and attack from cowboys. 

1. The aliens (red dots) will attack the cloest cowboys (green dots), the cowboy will die once aliens get closed enough.
2. Cowboy will choose the leader by an election (depends on which consensus aglorithm), the leader will send heartbeat message (oranges dots) to the cowboys.
3. The cowboys will report their current position and alien position if they see any.
4. Cowboy can aim (cyan line) the aliens that are in range, and will ask for help (purpule dot) from leader. They need 2 cowboys to kill the alien.
5. Alien will stop moving whlile being aimed.
6. The leader will look at all the position of the cowboys, find the closest one and send a rescure message (purple dot)
7. Once the cowboy received the message (purple), he will move.
8. There is a posibility that there are other aliens respawning.

<p align="center">
  <img src="https://github.com/tingkelvin/Cowboys-Aliens/assets/49113121/bc9a8d7b-1eff-4aa9-a57e-bc3cac36a68c" />
</p>







