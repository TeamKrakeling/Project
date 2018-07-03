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
# A function that processes a date object so it is styled the same way as the dates in the database 
def process_date(date):
	processed = str(date.year) 
	if date.month < 10:
		processed = processed + "0"
	processed = processed + str(date.month) 
	if date.day < 10:
		processed = processed + "0"
	processed = processed + str(date.day)
	return processed

# The function that creates the plot
def create_house_current_temp_plot():
	print "Create plot."
	# Collect the data
	current_date = datetime.date.today()
	processed_current_date = process_date(current_date)

	temperature_nodes = {"temperature_node_1":[],"temperature_node_2":[],"temperature_node_3":[],"temperature_node_4":[],"temperature_node_5":[],"temperature_node_6":[]}

	room_temps = []
	data_available = True
	for node in temperature_nodes.keys():
		print processed_current_date
		temperature_nodes[node] = json.loads(urllib2.urlopen("http://145.24.222.23:8181/get_data?table=" + node + "&time_period=" + processed_current_date).read())
		# Checks if data is returned. If not, it checks the previous day. If the previous day also does not have data available, there is no data available from recently enough
		if len(temperature_nodes[node]) < 1:
			yesterday = current_date - datetime.timedelta(days=1)
			processed_yesterday = process_date(yesterday)
			temperature_nodes[node] = json.loads(urllib2.urlopen("http://145.24.222.23:8181/get_data?table=" + node + "&time_period=" + processed_yesterday).read())
			if len(temperature_nodes[node]) < 1:
				data_available = False
				break	
		room_temps.append(temperature_nodes[node][0]['temperature'])

	if data_available:
		# Prepare the data
		legend_xs = [[33,33,34,34] for x in range (23)]
		legend_ys = [[12.5-0.5*x,13-0.5*x,13-0.5*x,12.5-0.5*x] for x in range (23)]
		legend_temp_names = [str(x) + "° C" for x in range(10, 33)]
		legend_temps = [x for x in range (10, 33)]

		house_xs = [[1,1,8,8],[1,1,8,8],[1,1,8,8,10,10],[8,8,16,16],[10,10,16,16],[22,22,31,31]]
		house_ys = [[10,14,14,10],[6,10,10,6],[1,6,6,8,8,1],[8,14,14,8],[4,8,8,4],[1,14,14,1]]
		room_names = ["bedroom","bedroom","living room","hall","bathroom","living room"]

		color_mapper = LinearColorMapper(palette=palette)

		source = ColumnDataSource(data=dict(
			x=house_xs + legend_xs,
			y=house_ys + legend_ys,
			name=room_names + legend_temp_names,
			temp=room_temps + legend_temps
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
		
		# Add text to the visualisation
		text_counter = 0
		for item in room_names:
			mytext = Label(x=house_xs[text_counter][0] + 0.5, y=house_ys[text_counter][0] + 0.2, text=room_names[text_counter], text_color='black')
			p.add_layout(mytext)
			text_counter += 1
		
		legend_text = Label(x=33, y=13.5, text="Legend",text_color='black')
		p.add_layout(legend_text)
		legend_text_2 = Label(x=34.25, y=12.5, text="10°",text_color='black')
		p.add_layout(legend_text_2)
		legend_text_3 = Label(x=34.25, y=7, text="21°",text_color='black')
		p.add_layout(legend_text_3)
		legend_text_4 = Label(x=34.25, y=1.5, text="32°",text_color='black')
		p.add_layout(legend_text_4)

		# Set the tooltip content
		hover = p.select_one(HoverTool)
		hover.tooltips = [
			("Temperature (°C)", "@temp"),
		]
		
		# Send
		file_name = "house_temperature_visualisation_div.html"
		error_message = "There is no data available, or the data available is more than 2 days old. Please check if all nodes are funtioning correctly. "
		write_plot_file(p, file_name, error_message, data_available)

# Funtion that writes the plot and some additional html code into an html file so the plot can be added to the site
# It expects a plot p, an html file name for the plot to be written to and an error message for when there is no (recent) data
def write_plot_file(p, plot_file_name, no_data_error_message, data_available):	#TODO: Move data available if possible
	if data_available:
		html_links = """<link
href="http://cdn.pydata.org/bokeh/release/bokeh-0.12.14.min.css"
rel="stylesheet" type="text/css">
<link
href="http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.14.min.css"
rel="stylesheet" type="text/css">
<script src="http://cdn.pydata.org/bokeh/release/bokeh-0.12.14.min.js"></script>
<script src="http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.14.min.js"></script>
"""
		
		script, div = components(p)
		div_file = open(plot_file_name, "w")
		div_file.write(html_links)
		div_file.write(script)
		div_file.write(div)
		div_file.close()
	else:
		# When there is no (recent) data, a message is printed, and a message is displayed instead of the visualisation.
		print no_data_error_message
		div_file = open(plot_file_name, "w")
		div_file.write("<div><p>" + no_data_error_message + "</p></div>")
		div_file.close()

# Run the code every 30 minutes
#schedule.every(30).minutes.do(create_plot)
create_house_current_temp_plot()

"""while True:
    schedule.run_pending()
    time.sleep(1)
"""
