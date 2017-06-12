# -*- coding: utf-8 -*-
import urllib2
import json
import datetime

from bokeh.plotting import figure, output_file, show
from bokeh.palettes import Plasma11 as palette
from bokeh.plotting import figure
from bokeh.models import (
    ColumnDataSource,
    HoverTool,
    LinearColorMapper,
	Legend
)
from bokeh.models.widgets import Panel, Tabs
from bokeh.embed import components

# Function definitions
def process_date(date):
	processed = str(date.year) 
	if date.month < 10:
		processed = processed + "0"
	processed = processed + str(date.month) 
	if date.day < 10:
		processed = processed + "0"
	processed = processed + str(date.day)
	return processed


# Collect the data
#TODO: Get current date and time to get the last entry?
current_date = datetime.date.today()
processed_current_date = process_date(current_date)

temperature_nodes = {"temperature_node_1":[],"temperature_node_2":[],"temperature_node_3":[],"temperature_node_4":[],"temperature_node_5":[],"temperature_node_6":[]}

room_temps = []
counter = 0;
data_available = True
for node in temperature_nodes.keys():
	print processed_current_date
	temperature_nodes[node] = json.loads(urllib2.urlopen("http://145.24.222.95:8181/get_data?table=" + node + "&time_period=" + processed_current_date).read())
	# Checks if data is returned. If not, it checks the previous day. If the previous day also does not have data available, there is no data available from recently enough
	if len(temperature_nodes[node]) < 1:
		yesterday = current_date - datetime.timedelta(days=1)
		processed_yesterday = process_date(yesterday)
		temperature_nodes[node] = json.loads(urllib2.urlopen("http://145.24.222.95:8181/get_data?table=" + node + "&time_period=" + processed_yesterday).read())
		if len(temperature_nodes[node]) < 1:
			data_available = False
			break	
	print temperature_nodes[node][0]['date']
	print temperature_nodes[node][0]['time']
	print temperature_nodes[node][0]['temperature']
	room_temps.append(temperature_nodes[node][0]['temperature'])
	data_available
	counter += 1

if data_available:
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


	# Set the tooltip content
	hover = p.select_one(HoverTool)
	hover.tooltips = [
		("Room", "@name"),
		("Temperature (°C)", "@temp"),
	]

	# Show the results
	show(p)


	# Write everything into html files so the plots can be added to the site
	script, div = components(p)

	script_file = open("house_temperature_visualisation_script.html", "w")
	script_file.write(script)
	script_file.close()
	div_file = open("house_temperature_visualisation_div.html", "w")
	div_file.write(div)
	div_file.close()
else:
	print "There is no data available"