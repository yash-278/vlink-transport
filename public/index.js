$("#example1").calendar();
$("#example2").calendar({
  type: "date",
});
$("#example3").calendar({
  type: "time",
});
$("#rangestart").calendar({
  type: "date",
  endCalendar: $("#rangeend"),
});
$("#rangeend").calendar({
  type: "date",
  startCalendar: $("#rangestart"),
});
$("#example4").calendar({
  startMode: "year",
});
$("#example5").calendar();
$("#example6").calendar({
  ampm: false,
  type: "time",
});
$("#example7").calendar({
  type: "month",
});
$("#example8").calendar({
  type: "year",
});
$("#example9").calendar();
$("#example10").calendar({
  on: "hover",
});
var today = new Date();
$("#example11").calendar({
  minDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
  maxDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
});
$("#example12").calendar({
  monthFirst: false,
});
$("#example13").calendar({
  monthFirst: false,
  formatter: {
    date: function (date, settings) {
      if (!date) return "";
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var year = date.getFullYear();
      return day + "/" + month + "/" + year;
    },
  },
});
$("#example14").calendar({
  inline: true,
});
$("#example15").calendar();

//Get the button:
mybutton = document.getElementById("backTop");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}
