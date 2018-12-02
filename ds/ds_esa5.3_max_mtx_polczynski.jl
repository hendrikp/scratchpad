# DS ESA5.3 Polczynski - Create a 2x4 two dimensional matrix with random floats in it and in the next step determine the biggest element.

mtx = rand( 2, 4)
println("\r\n Matrix: ", mtx, "\r\n")

max = findmax( mtx )
println("\r\n Max value found: ", max[1], " at index ", max[2], " \r\n" )
