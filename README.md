## Code Reviewer Recommendation Algorithm

by Jan Techner and Sebastian Maciejewski

The repository is the attachment to the master thesis and contains the following elements: 

 - the implementation of the profile based code reviewer recommendation algorithm presented in the paper "Profile based recommendation of code reviewers" by Mikołaj Fejzer, Piotr Przymus and Krzysztof Stencel
 - the dataset used to evaluate the algorithm
 - the results of the algorithm as a .csv file
 - the data provider that allows to fetch the data from the other open source repositories


### Installation

The algorithm is implemented using Python 3.8.
You can install Python dependencies using the following command:
```
pip3 install -r requirements.txt
```
### Execution

In order to run the algorithm use the following command

```
python3 new.py data/android.json 
```

You can also print the results as comma-separated values:

```
python3 new.py data/android.json --csv
```