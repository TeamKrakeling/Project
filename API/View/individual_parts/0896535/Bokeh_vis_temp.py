# -*- coding: utf-8 -*-
import urllib2
import json

from bokeh.plotting import figure, output_file, show
from bokeh.palettes import Plasma11 as palette
from bokeh.plotting import figure
from bokeh.models import (
    ColumnDataSource,
    HoverTool,
    LinearColorMapper,
	Legend
)
from bokeh.embed import components

# For the node management page
#json_test = json.loads(urllib2.urlopen("http://145.24.222.95:8181/get_tablelist").read())

# Collect the data
#TODO: Get current date and time to get the last entry?
temperature_nodes = {"temperature_node_1":[],"temperature_node_2":[],"temperature_node_3":[],"temperature_node_4":[],"temperature_node_5":[],"temperature_node_6":[]}

room_temps = []
counter = 0;
for node in temperature_nodes.keys():
	temperature_nodes[node] = json.loads(urllib2.urlopen("http://145.24.222.95:8181/get_data?table=" + node + "&time_period=20170611").read())
	print temperature_nodes[node][0]['date']
	print temperature_nodes[node][0]['time']
	print temperature_nodes[node][0]['temperature']
	room_temps.append(temperature_nodes[node][0]['temperature'])
	counter += 1

# Prepare the data
legend_xs = [[34,34,35,35],[34,34,35,35]]
legend_ys = [[13,14,14,13],[12,13,13,12]]

house_xs = [[1,1,8,8],[1,1,8,8],[1,1,8,8,10,10],[8,8,16,16],[10,10,16,16],[23,23,32,32]]
house_ys = [[10,14,14,10],[6,10,10,6],[1,6,6,8,8,1],[8,14,14,8],[4,8,8,4],[1,14,14,1]]
room_names = ["bedroom","bedroom","living room","hall","bathroom","living room"]

color_mapper = LinearColorMapper(palette=palette)

source = ColumnDataSource(data=dict(
    x=house_xs,
    y=house_ys,
    name=room_names,
    temp=room_temps
))

TOOLS = "reset,hover,save"

# Create the visualisation
p = figure(
    title="Temperatures CHIBB house", tools=TOOLS,
    x_axis_location=None, y_axis_location=None,
	width=1000,height=500
)
p.grid.grid_line_color = None

p.patches('x', 'y', source=source,
	fill_color={'field': 'temp', 'transform': color_mapper},
	fill_alpha=0.8, 
	line_color="white", 
	line_width=3
)

# TODO: Add a legend?
"""r3 = p.square(1,1,size=4, angle=0.0, fill_color=None, line_color="green")
legend = Legend(items=[
    ("sin(x)", r3),
    ("2*sin(x)", r3),
    ("3*sin(x)", r3),
], location=(0, -30))
p.add_layout(legend, 'right')
"""
"""p.patches(legend_xs, legend_ys,
	fill_color=palette,
	fill_alpha=0.8
)
"""

# Set the tooltip content
hover = p.select_one(HoverTool)
hover.tooltips = [
    ("Room", "@name"),
	("Temperature (°C)", "@temp"),
]

# Show the results
show(p)

"""legend = figure(tools=None)
legend.toolbar_location=None
legend.rect(x=0.5, y='value', fill_color='color', width=1, height=1, source=source)
layout = hplot(main, legend)"""
#show(legend)

#grid = gridplot(p, legend)

# Write everything into html files so the plots can be added to the site
script, div = components(p)

script_file = open("temperature_visualisation.js", "w")
script_file.write("document.getElementById('scriptDiv').innerHTML(`");
script_file.write(script)
script_file.write("`)\n")
script_file.write("document.getElementById('divDiv').innerHTML(`");
script_file.write(div)
script_file.write("`)")
script_file.close()


#show(grid)