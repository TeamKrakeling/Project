# -*- coding: utf-8 -*-

# Author: Rianne (Team Krakeling)
# Summary: The python section of my part of the CHIBB house project. This code creates the plots shown on the visualisation page.

# -- Imports --
import urllib2
import json
import datetime
import schedule
import time
import sys
from numpy import mean

from bokeh.plotting import figure, output_file, show
from bokeh.palettes import Plasma11 as palette
from bokeh.plotting import figure
from bokeh.models import (ColumnDataSource, HoverTool, LinearColorMapper, Label, DatetimeTickFormatter)
from bokeh.models.widgets import Panel, Tabs
from bokeh.embed import (components, autoload_static)

# -- Function definitions --
# - Utility functions -
# Function that processes a date object so it is styled the same way as the dates in the database
# It expects a date object
def process_date(date_to_process):
	processed = str(date_to_process.year) 
	if date_to_process.month < 10:
		processed = processed + "0"
	processed = processed + str(date_to_process.month) 
	if date_to_process.day < 10:
		processed = processed + "0"
	processed = processed + str(date_to_process.day)
	return processed
	
# Function that processes a date gotten from the database into a datetime object
# It expects a string in the format "yyyymmdd"
def process_date_reverse(date):
	year = int(date[0] + date[1] + date[2] + date[3])
	month = int(date[4] + date[5])
	day = int(date[6] + date[7])
	return datetime.datetime(year, month, day)
	
# Function that gets the average temperature per day of a series of days
# It expects a list with tuples with a date (preferably in "yyyymmdd" format) and a data point (like temperature or humidity)
def get_averages(data):
	sorted_data = sorted(data, key=lambda tuple: tuple[1])
	
	date_memory = sorted_data[0][1]
	date_average_collector = {}
	date_average_collector[date_memory] = []
	
	for data_point in sorted_data:
		if data_point[1] == date_memory:
			date_average_collector[data_point[1]].append(int(data_point[0]))
		else:
			date_memory = data_point[1]
			date_average_collector[date_memory] = [int(data_point[0])]
			
	date_averages = []
	for average in date_average_collector.keys():
		date_averages.append([average, mean(date_average_collector[average])])
	
	return sorted(date_averages, key=lambda tuple: tuple[0])

# Function that collects the data
# It expects a list of the nodes, dates you want to collect data from and what data you want from them, and a boolean only_most_recent (indicating if you want all data, or only the most recent).
# It expects four values:  the nodes as a dictionary of nodenames and lists, the dates in the format of "yyyymmdd", "yyyymm" or "yyyy", and the data_to_collect as a list of strings
# Example: nodes = {"temperature_node_1":[],"temperature_node_2":[]} and dates = ["20180524", "201806", "2016"], fields = ["temperature", "time"] and only_most_recent = False
def get_data(nodes, dates, fields, only_most_recent):
	missed_data = False
	data_points = {}
	for field in fields:
		data_points[field] = []
	
	for node in nodes.keys():
		if missed_data == False:
			for date in dates:
				print date
				
				nodes[node] = json.loads(urllib2.urlopen("http://145.24.222.23:8181/get_data?table=" + node + "&time_period=" + date).read())
				# Checks if data is returned. If there is no data available, this means there is no data available or no data available from recently enough.
				if len(nodes[node]) < 1:
					print "Stopped at " + node
					missed_data = True
					break
				# Then returns the data that was asked for
				if only_most_recent:
					for field in fields:
						data_points[field].append(nodes[node][0][field])
				else:
					for data_point in nodes[node]:
						for field in fields:
							data_points[field].append(data_point[field])
					
	#print data_points
	return data_points
	
# - Plot functions -
# Function that creates a map plot with current temperatures in the CHIBB house
# It expects 3 values: a string that will be the title of the plot, a dictionary of strings with lists containing the nodes to get data from and a list of dates to get data from. 
# Example: plot_title = "Temperature map", nodes_to_get = {"temperature_node_1":[],"temperature_node_2":[]} and dates = ["20180524", "201806", "2016"]
# Note: This function is only meant for nodes containing temperature measurements.
def create_house_current_temp_plot(plot_title, nodes_to_get, dates_to_get):
	#Collect data
	values_to_get = ["temperature"]
	
	result_data = get_data(nodes_to_get, dates_to_get, values_to_get, True)
	
	print "Create current temperatures map plot."	
	if len(result_data[values_to_get[0]]) > 0:
		# If data is available, prepare the data for use in the plot
		room_temps = result_data["temperature"]
		
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
			title = plot_title, tools = plot_tools,
			x_axis_location = None, y_axis_location = None,
			width = 1000, height = 500
		)
		p.grid.grid_line_color = None

		p.patches("x", "y", source=source,
			fill_color = {"field": "temp", "transform": color_mapper},
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
		
		return p
	else:
		return False

# Function that creates a temperature history plot of the CHIBB house
# It expects 3 values: a string that will be the title of the plot, a dictionary of strings with lists containing the nodes to get data from, a list of dates to get data from and a string that is the database field your chosen data is stored in
# Example: plot_title = "Temperature history 2018", nodes_to_get = {"temperature_node_1":[],"temperature_node_2":[]} and dates = ["20180524", "201806", "2016"] and first_value_to_get = "temperature"
def create_data_history_plot(plot_title, plot_y_axis_label, nodes_to_get, dates_to_get, first_value_to_get):
	# Collect data
	values_to_get = [first_value_to_get]
	values_to_get.append("date")
	print "Create " + values_to_get[0] + " history plot."
	
	result_data = get_data(nodes_to_get, dates_to_get, values_to_get, False)
	
	print "Create " + values_to_get[0] + " history plot."
	
	if len(result_data[values_to_get[0]]) > 0:
		# If data is available, prepare the data for use in the plot
		history_data_tuples = get_averages(zip(result_data[values_to_get[0]], result_data["date"]))
		history_dates, history_data_points = zip(*history_data_tuples)
		history_dates = map(process_date_reverse, history_dates)
		
		print history_data_points
		
		source = ColumnDataSource(data=dict(
			date = history_dates,
			data_point = history_data_points
		))
		
		plot_tools = "reset,hover,save"
		
		# Create a new plot
		p = figure(
			title = plot_title, tools = plot_tools,
			plot_width = 1000, plot_height = 250, 
			x_axis_type = "datetime", x_axis_label = "Date", y_axis_label = plot_y_axis_label
		)
		
		p.line("date", "data_point", source = source, color = "navy")
		p.circle("date", "data_point", source = source, size = 5, color = "navy", alpha = 0.5)
		
		p.xaxis.formatter=DatetimeTickFormatter(
			hours=["%d %B %Y"],
			days=["%d %B %Y"],
			months=["%d %B %Y"],
			years=["%d %B %Y"],
		)
		
		# Set the tooltip content
		hover = p.select_one(HoverTool)
		hover.tooltips = [
			("Date", "@date{%d %B %Y}"),
			(plot_y_axis_label, "@data_point")
		]
		hover.formatters = { "date": "datetime"}
		
		return p
	else:
		return False

# - Execution function -
# Funtion that executes the plot functions and then writes the plot and some additional html code into an html file so the plot can be added to the site
def create_plots():
	plot_file_name = "views/individual_parts/0896535/house_visualisation_div.html"
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
	new_date = process_date(datetime.date.today())
	current_date = [new_date]
	current_month = [new_date[:-2]]
	current_month_text = str(datetime.date.today().strftime("%B"))
	current_year = [new_date[:-4]]
	temperature_nodes = {"temperature_node_1":[],"temperature_node_2":[],"temperature_node_3":[],"temperature_node_4":[],"temperature_node_5":[],"temperature_node_6":[]}
	humididy_nodes = {"humidity_node_1":[],"humidity_node_2":[],"humidity_node_3":[],"humidity_node_4":[]}
	
	plots["CHIBB house current temperatures plot"] = create_house_current_temp_plot("Current temperatures", temperature_nodes, current_date)
	plots["CHIBB house temperature history plot month"] = create_data_history_plot("Temperature history " + current_month_text + " " + current_year[0], "Temperature (°C)", temperature_nodes, current_month, "temperature")
	plots["CHIBB house temperature history plot year"] = create_data_history_plot("Temperature history " + current_year[0], "Temperature (°C)", temperature_nodes, current_year, "temperature")
	#plots["CHIBB house humidity"] = create_data_history_plot("Humidity history 2018", "Humidity (in % of max humidity)", humididy_nodes, current_year, "humidity")
	
	# Write everyting to the file
	div_file = open(plot_file_name, "w")
	div_file.write(html_links)
	
	for plot in sorted(plots.keys()):
		if plots[plot] == False:
			no_data_error_message = "For " + plot + ", there is no data available, or the data available is too old. Please check if all nodes are functioning correctly"
			print no_data_error_message
			div_file.write("<div><p>" + no_data_error_message + "</p></div>")
		else:
			script, div = components(plots[plot])
			div_file.write(script)
			div_file.write(div)
			
	div_file.close()
	
create_plots()