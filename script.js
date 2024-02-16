// Accessing necessary DOM elements
const busStopIdInput = document.getElementById("bus-stop-id");
const arrivalInfoTableBody = document.querySelector("#arrival-info-table tbody");
const stationInfoTableBody = document.querySelector("#station-info-table tbody");
const reminder = document.getElementById("reminder");
const busDropdownSelection = document.getElementById("bus-number-dropdown");

// Variables for filtering bus data and managing interval updates
let filteredBusNum; // Stores the selected bus number for filtering
let intervalId = null; // ID for the interval timer, initialized as null

// Function to fetch bus arrival data from the API
async function fetchBusArrival(busStopId) {
  const response = await fetch(`https://arrivelah2.busrouter.sg/?id=${busStopId}`);
  if (response.ok) {
    return response.json();
  } else {
    throw new Error("Error fetching bus arrival data.");
  }
}

// Function to format the retrieved bus arrival data into a readable format
function formatArrivalData(arrivalData, busNumber) {
  let buses = arrivalData.services;
  const formattedData = [];
  const currentTime = new Date();

  if (busNumber) {
    buses = buses.filter(bus => bus.no === busNumber);
  }

  for (const bus of buses) {
    const busNum = bus.no;
    const formatTime = (time) => time ? new Date(time) : null;
    const busTime1 = formatTime(bus.next?.time);
    const busTime2 = formatTime(bus.next2?.time);
    const busTime3 = formatTime(bus.next3?.time);

    const getTimeDifferenceInMinutes = (arrivalTime) => {
      if (!arrivalTime) return "-";
      const timeDifference = (arrivalTime - currentTime) / (1000 * 60); // Convert milliseconds to minutes
      return timeDifference >= 0 ? Math.ceil(timeDifference) + " minutes" : "Arriving soon";
    };

    const remainingTime1 = getTimeDifferenceInMinutes(busTime1);
    const remainingTime2 = getTimeDifferenceInMinutes(busTime2);
    const remainingTime3 = getTimeDifferenceInMinutes(busTime3);

    formattedData.push(`
      <tr class="text-center">
        <td><strong>${busNum}</strong></td>
        <td>${remainingTime1}</td>
        <td>${remainingTime2}</td>
        <td>${remainingTime3}</td>
      </tr>
    `);
  }
  return formattedData.join("");
}

// Function to populate the bus number dropdown with available options
function populateDropdown(arrivalData) {
  const buses = arrivalData.services;
  const busNumList = [];

  for (const bus of buses) {
    const busNumber = bus.no;
    busNumList.push(`
      <li><a class="dropdown-item" href="#" onclick="setBusStopId('${busNumber}')">Bus No. ${busNumber}</a></li>
    `);
  }
  return busNumList.join("");
}

// Function to display bus arrival data on the webpage
function displayBusArrival(busStopId) {
  // Clear previous interval when the user requests a new bus stop
  if (intervalId) {
    clearInterval(intervalId);
  }

  fetchBusArrival(busStopId)
    .then(arrivalData => {
      let formattedArrivalData;
      const formattedBusNumber = populateDropdown(arrivalData);

      // Check if bus number is selected to filter
      if (filteredBusNum) {
        formattedArrivalData = formatArrivalData(arrivalData, filteredBusNum);
      } else {
        formattedArrivalData = formatArrivalData(arrivalData);
      }

      // Display bus arrival data on the webpage if bus arrival data is available
      if (formattedArrivalData) {
        arrivalInfoTableBody.innerHTML = formattedArrivalData;
        busDropdownSelection.innerHTML = formattedBusNumber;
      } else {
        arrivalInfoTableBody.innerHTML = "No bus arrival data available.";
        busDropdownSelection.innerHTML = "";
      }
    })
    .catch(error => {
      reminder.innerHTML = "Error fetching bus arrival data.";
    });

  // Update bus arrival data every 15 seconds
  intervalId = setInterval(() => {
    fetchBusArrival(busStopId)
      .then(arrivalData => {
        let formattedArrivalData;
        const formattedBusNumber = populateDropdown(arrivalData);

        // Check if bus number is selected to filter
        if (filteredBusNum) {
          formattedArrivalData = formatArrivalData(arrivalData, filteredBusNum);
        } else {
          formattedArrivalData = formatArrivalData(arrivalData);
        }

        // Display bus arrival data on the webpage if bus arrival data is available
        if (formattedArrivalData) {
          arrivalInfoTableBody.innerHTML = formattedArrivalData;
          busDropdownSelection.innerHTML = formattedBusNumber;
        } else {
          arrivalInfoTableBody.innerHTML = "No bus arrival data available.";
          busDropdownSelection.innerHTML = "";
        }
      })
      .catch(error => {
        reminder.innerHTML = "Error fetching bus arrival data.";
      });
  }, 15000);
}

// Function to handle the retrieval of bus timing information
function getBusTiming() {
  const busStopId = busStopIdInput.value.trim();

  if (busStopId) {
    displayBusArrival(busStopId);
    displayBusStops() // Call the function to display bus stops
  } else {
    reminder.innerHTML = "Please enter a bus stop ID.";
  }
}

// Function to set the selected bus stop ID for filtering
function setBusStopId(busNumber) {
  filteredBusNum = busNumber;
  getBusTiming();
}

// Function to fetch bus stop data from another API
async function fetchBusStopData() {
  const response = await fetch(`https://data.busrouter.sg/v1/stops.min.json`);
  const busStopData = await response.json();
  return busStopData;
}

// Function to store bus stop IDs in an array
function storeBusStopId(busStopData) {
  const busStopIds = Object.keys(busStopData);
  return busStopIds;
}

// Function to display bus stop names and destinations on the page
function displayBusStops() {
  fetchBusStopData()
    .then(busStopData => {
      const busStopIds = storeBusStopId(busStopData);
      const busStopId = busStopIdInput.value.trim();

      if (busStopIds.includes(busStopId)) {
        const busStop = busStopData[busStopId];
        stationInfoTableBody.innerHTML = `
            <tr class="text-center">
              <td>${busStop[2]} (${busStopId})</td>
              <td>${busStop[3]}</td>
            </tr>
          `;
      } else {
        stationInfoTableBody.innerHTML = "Bus station not found.";
      }
    })
    .catch(error => {
      console.error(error);
    });
}

// Function to clear the applied filter
function clearFilter() {
  filteredBusNum = null;
  getBusTiming();
}

// Function to reset all fields and data on the page
function resetAll() {
  busStopIdInput.value = "";
  filteredBusNum = null;
  stationInfoTableBody.innerHTML = "";
  arrivalInfoTableBody.innerHTML = "";
  busDropdownSelection.innerHTML = "";
  reminder.innerHTML = "";

  if (intervalId) {
    clearInterval(intervalId);
  }
}

// Function to display the current time on the page
function currentTime() {
  const currentTime = document.getElementById("current-time");
  const updateClock = () => {
    const currentTimes = new Date();
    let hours = currentTimes.getHours();
    const minutes = currentTimes.getMinutes();
    const seconds = currentTimes.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    currentTime.innerHTML = `Current Time : ${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
  };
  setInterval(updateClock, 1000); // Update every second
  updateClock(); // Call immediately to avoid delay in initial display
}

// Call the currentTime function to initialize the clock display
currentTime();