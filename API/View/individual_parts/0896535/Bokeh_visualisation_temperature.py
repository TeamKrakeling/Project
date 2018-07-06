# -*- coding: utf-8 -*-
import urllib2
import json
import datetime
import schedule
import time

from bokeh.plotting import figure, output_file, show
from bokeh.palettes import Plasma11 as palette
from bokeh.plotting import figure
from bokeh.models import (ColumnDataSource, HoverTool, LinearColorMapper, Label)
from bokeh.models.widgets import Panel, Tabs
from bokeh.embed import (components, autoload_static)

# Function definitions
# Function that processes a date object so it is styled the same way as the dates in the database
# It expects a date object
def process_date(date):
	processed = str(date.year) 
	if date.month < 10:
		processed = processed + "0"
	processed = processed + str(date.month) 
	if date.day < 10:
		processed = processed + "0"
	processed = processed + str(date.day)
	return processed

# Function that collects the data
# It expects a list of the nodes and dates you want to collect data from and boolean only_most_recent (indicating if you want all data, or only the most recent).
# It expects the nodes as a dictionary of nodenames and lists, and the dates in the format of "yyyymmdd", "yyyymm" or "yyyy"
# Example: nodes = {"temperature_node_1":[],"temperature_node_2":[]} and dates = ["20180524", "201806", "2016"]
def get_data(nodes, dates, only_most_recent):
	data_points = []
	
	for node in nodes.keys():
		for date in dates:
			print date
			nodes[node] = json.loads(urllib2.urlopen("http://145.24.222.23:8181/get_data?table=" + node + "&time_period=" + date).read())
			# Checks if data is returned. If there is no data available, this means there is no data available or no data available from recently enough.
			if len(nodes[node]) < 1:
				print "Stopped at " + node
				break
			if only_most_recent:
				data_points.append(nodes[node][0]["temperature"])
			else:
				for data_point in nodes[node]:
					data_points.append(data_point["temperature"])
					
	print data_points
	return data_points
	
# Function that creates the map plot with current temperatures in the CHIBB house
def create_house_current_temp_plot():
	print "Create current temperatures map plot."
	
	#Collect data
	temperature_nodes = {"temperature_node_1":[],"temperature_node_2":[],"temperature_node_3":[],"temperature_node_4":[],"temperature_node_5":[],"temperature_node_6":[]}
	current_date = datetime.date.today()
	dates_to_get = []
	dates_to_get.append(process_date(current_date))
	
	room_temps = get_data(temperature_nodes, dates_to_get, True)
	print room_temps

	if len(room_temps) > 0:
		# If data is available, prepare the data for use in the plot
		legend_xs = [[33, 33, 34, 34] for x in range (23)]
		legend_ys = [[12.5-0.5*x, 13-0.5*x, 13-0.5*x, 12.5-0.5*x] for x in range (23)]
		legend_temp_names = [str(x) + "° C" for x in range(10, 33)]
		legend_temps = [x for x in range (10, 33)]

		house_xs = [[1, 1, 8, 8], [1, 1, 8, 8], [1, 1, 8, 8, 10, 10], [8, 8, 16, 16], [10, 10, 16, 16], [22, 22, 31, 31]]
		house_ys = [[10, 14, 14, 10], [6, 10, 10, 6], [1, 6, 6, 8, 8, 1], [8, 14, 14, 8], [4, 8, 8, 4], [1, 14, 14, 1]]
		room_names = ["bedroom", "bedroom", "living room", "hall", "bathroom", "living room"]

		color_mapper = LinearColorMapper(palette=palette)

		source = ColumnDataSource(data=dict(
			x = house_xs + legend_xs,
			y = house_ys + legend_ys,
			name = room_names + legend_temp_names,
			temp = room_temps + legend_temps
		))
		
		plot_tools = "reset,hover,save"

		# Create the visualisation
		p = figure(
			title = "Current temperatures CHIBB house", tools = plot_tools,
			x_axis_location = None, y_axis_location = None,
			width = 1000, height = 500
		)
		p.grid.grid_line_color = None

		p.patches('x', 'y', source=source,
			fill_color = {'field': 'temp', 'transform': color_mapper},
			fill_alpha = 0.8, line_color = "white",	line_width = 3
		)
		
		# Add text to the visualisation
		text_counter = 0
		for item in room_names:
			mytext = Label(x = house_xs[text_counter][0] + 0.5, y = house_ys[text_counter][0] + 0.2, text = room_names[text_counter], text_color = 'black')
			p.add_layout(mytext)
			text_counter += 1
		
		legend_text = Label(x = 33, y = 13.5, text = "Legend", text_color = 'black')
		p.add_layout(legend_text)
		legend_text_2 = Label(x = 34.25, y = 12.5, text = "10°", text_color = 'black')
		p.add_layout(legend_text_2)
		legend_text_3 = Label(x = 34.25, y = 7, text = "21°", text_color = 'black')
		p.add_layout(legend_text_3)
		legend_text_4 = Label(x = 34.25, y = 1.5, text = "32°", text_color = 'black')
		p.add_layout(legend_text_4)

		# Set the tooltip content
		hover = p.select_one(HoverTool)
		hover.tooltips = [
			("Temperature (°C)", "@temp")
		]
		
		return p, True
	else:
		return p, False

# Function that creates the temperature history plot of the CHIBB house
def create_temperature_history_plot():
	print "Create temperature history plot."
	
	# Collect data
	temperature_nodes = {"temperature_node_1":[], "temperature_node_2":[], "temperature_node_3":[], "temperature_node_4":[], "temperature_node_5":[], "temperature_node_6":[]}
	dates = ["20180706"]
	history_temps = get_data(temperature_nodes, dates, False)
	print history_temps
	
	if len(history_temps) > 0:
		# If data is available, prepare the data for use in the plot
		x = list(range(len(history_temps)))
		y0 = x
		y1 = [10 - i for i in x]
		y2 = [abs(i - 5) for i in x]

		plot_tools = "reset,hover,save"
		
		# Create a new plot
		p = figure(
			title = "Temperature history", tools = plot_tools,
			plot_width = 1000, plot_height = 250
		)
		
		p.xaxis.axis_label = 'Date'
		p.yaxis.axis_label = 'Temperature'
		
		p.line(x, history_temps, color = 'navy')
		p.circle(x, history_temps, size = 10, color = "navy", alpha = 0.5)
		
		return p, True
	else:
		return p, False

# Funtion that executes the plot functions and then writes the plot and some additional html code into an html file so the plot can be added to the site
def create_plots():
	plot_file_name = "house_temperature_visualisation_div.html"
	html_links = """<link
href="http://cdn.pydata.org/bokeh/release/bokeh-0.12.14.min.css"
rel="stylesheet" type="text/css">
<link
href="http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.14.min.css"
rel="stylesheet" type="text/css">
<script src="http://cdn.pydata.org/bokeh/release/bokeh-0.12.14.min.js"></script>
<script src="http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.14.min.js"></script>
"""

	# Execute the create plot functions for the plots that are going to be drawn
	plots = {}
	plots["CHIBB house current temperatures plot"] = create_house_current_temp_plot()
	plots["CHIBB house temperature history plot"] = create_temperature_history_plot()	# TODO: Sort the plots?
	
	# Write everyting to the file
	div_file = open(plot_file_name, "w")
	div_file.write(html_links)
	
	for plot in plots.keys():
		print plot
		if plots[plot][1]:
			script, div = components(plots[plot][0])
			div_file.write(script)
			div_file.write(div)
		else:
			no_data_error_message = "For " + plot + ", there is no data available, or the data available is too old. Please check if all nodes are functioning correctly"
			print no_data_error_message
			div_file.write("<div><p>" + no_data_error_message + "</p></div>")
	div_file.close()
	
create_plots()

# Run the code every 30 minutes
#schedule.every(30).minutes.do(create_plot)

"""while True:
    schedule.run_pending()
    time.sleep(1)
"""
