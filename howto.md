# How to download, process and map five decades of crime data with javascript and d3

###Introduction
I was recently discussing my neighborhood with a couple people and was asked "What's the crime rate?" My reply was along the lines of "I don't know, seems safe enough, never really gave it much thought." But that question nagged at me. I decided I'd take a look around the webbernets and see what was out there. I quietly set a goal for myself to map crime rates (I was initially curious about murder rates) over the last few decades.

###Getting some data
I started poking around and found [The Department of Justice's Uniform Crime Reporting Statistics page](http://www.ucrdatatool.gov/Search/Crime/State/TrendsInOneVar.cfm). The DOJ provides stats for different geographies. I decided to  start with states as those are the simplest to map. The smaller geographies are probably more interesting as they will show more nuanced patterns but they'll also take more work to map.

After a little repetitive clicking, I had [.csv files with crime rates per 100,000 people for eight different types of crime](../../tree/master/raw). 

The general workflow to grab the data was:  

 * click the list of states, press `cmd + a` to select all
 * choose one of the crime types with `rate`
 * set years to 1960 to 2010
 * click `Get Table`

The resulting page shows the table, and it's tempting to parse it to pull out the data, but there's no need since there's a `Spreadsheet of this table` link that provides all data (plus some metadata) as a .csv file (and that's what you see in the `raw` directory in this repo). So that's how you get data for one crime type by state over five decades. Rinse and repeat for additional crime types.

### Data processing
With all .csv files on disk, it's time to get mapping right? Well, not quite. While the files from [ucrdatatool.gov](http://www.ucrdatatool.gov) contain all the data, they also contain additional information and notes. To avoid writing additional code to handle special cases, it's easier to clean up the data before trying to use it to drive a map. My usual tool for this is python and that's what I used. The script used to strip everything except the crime stats and write new files is [clean.py](../../blob/master/clean.py). Bonus:  I've been doing more and more with node so I re-wrote the script using [node and named it clean.js](../../blob/master/clean.js). It took a couple more lines than the python equivalent but produces identical output. 

### Make a map
Now that there's a set of files with crime stats by year, it's time to start mapping. I chose [d3](http://d3js.org/) + [topojson](https://github.com/mbostock/topojson) for this. Thanks to the ever prolific [Mike Bostock](http://bost.ocks.org/mike/), you rarely need to start from scratch. I started with [U.S. TopoJSON with outer glow](http://bl.ocks.org/mbostock/4136647) this time. I got rid of the counties since the data at hand is for states (I edited the topojson by hand, don't tell anyone, quick and dirty won out over robust and elegant this time). I also used [queue](https://github.com/mbostock/queue) to manage getting data to a web browser.

After including the [necessary libraries](../../blob/master/dev.html#L20-22), get the topojson and one of the data files to the browser using queue:
```javascript
  queue()
    .defer(d3.json, "usa/us-states.json")
    .defer(d3.csv, "data/" + crimes[selected] + ".csv")
    .await(show);
```
[–code from js/app.js](../../blob/master/js/app.js#L58-61). 

The code before the `queue` call in [app.js](../../blob/master/js/app.js) sets up an SVG element where the map will live as well as a select element that allows a visitor to change the type of crime shown on the map.

Once the data loads, the [`show`](../../blob/master/js/app.js#L63) function runs. This is where the states are drawn on the map and the stats for the current crime type are [joined](http://bost.ocks.org/mike/join/) to the associated states. To produce a map that's easy to understand, I used d3's [quantize scale](https://github.com/mbostock/d3/wiki/Quantitative-Scales#quantize-scales) to translate individual crime stats to categories ranging from low to high crime. When drawn on the map, areas of low crime are shown as a light peach color and high crime areas are dark red. The darker the red, the higher the crime. Colors were chosen using [ColorBrewer](http://colorbrewer2.org/). 

###Add a slider
Now that there's a map (specifically a [choropleth map](http://en.wikipedia.org/wiki/Choropleth_map)), the next goal was to hook up a slider. The obvious choice is an [input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input) with `type=range` that allows visitors to scrub through the data. To make the temporal navigation work, [select the slider](../../blob/master/js/app.js#L132) and add an event listener to update the data when the slider thumb changes position. The [`change` function](../../blob/master/js/app.js#L214-218) handles updating the data. I also [tweaked the size and look of the slider with some css](../../blob/master/css/styles.css#L88-113) and used a [media query to make it more touch friendly (bigger thumb) on iOS devices](../../blob/master/css/styles.css#L115-142). 

At this point, I'd satisfied my initial goal and I set this project aside. Upon re-visiting a couple days later, I decided it needed a couple more things if I wanted to show it off.

###More interaction
Because we're on the web, interaction and live feedback are expected. Up to this point, the map provided a good general picture of crime rates over time and how one state compared to another but it was lacking an easy way to get exact information about a particular state. The easy solution is to add a popup or tip to show info about a feature as the mouse cursor moves over it. 

To add a map tip, I used a [`div`](../../blob/master/dev.html#L18) and couple of events ([`mouseenter`](../../blob/master/js/app.js#L93) and [`mouseleave`](../../blob/master/js/app.js#L108)) to show info about a feature under the cursor. 

###The legend
The final component I wanted for the map was a legend. I looked around for an existing component, but didn't find anything to my liking. Luckily, d3 makes it easy to build a legend on the fly. After all, we're talking about a few rectangles and some labels. The relevant code is in [app.js, lines 165 - 197](../../blob/master/js/app.js#L165-197). In there, the data is flattened into an array, breaks are pulled out of the quantize scale (they're equal interval, if you're curious), labels are generated and rectangles are drawn to show what each color means.

###Linking
Once I made the jump from mapping a single type of crime to providing a way to switch between crime types, I wanted a way to persist the last type of crime mapped. That way, if you wanted to send someone directly to the map for vehicle theft, you could. 

I implemented this by adding the current crime type to the page hash. This happens in [app.js on line 30](../../blob/master/js/app.js#L30).

###Grunt
Once I was happy with the functionality, I decided I should bundle up the javascript libraries as well as the javascript I wrote into a single file and that I should minify the CSS. [Grunt](http://gruntjs.com/) along with [uglify](https://github.com/gruntjs/grunt-contrib-uglify) and [cssmin](https://github.com/gruntjs/grunt-contrib-cssmin) were the obvious choices. The output from that build process is what you see when you [visit the map on github pages](http://swingley.github.io/five-decades-of-crime/built.html). 

###Future
I'm tempted to continue work on this but not sure if I'll make the time to do it. I'd really like to see what crime patterns look like over time for the smaller geographies available from [ucrdatatool.gov](http://www.ucrdatatool.gov). If I do end up doing that, I'll be sure to push it up to this repo. If you made it this far, hat's off to you!
