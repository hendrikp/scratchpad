# DS ESA5.4 Polczynski -

# 1. Create two matrices of the same layout and test if addition and subtraction of the matrix works as expected: C = A + B
#

mtxA = rand( 2, 2 )
mtxB = rand( 2, 2 )
mtxC = mtxA + mtxB
display(mtxC)
mtxC -= mtxB
display(mtxC)

if mtxC == mtxA
    print("works as expected") #<- yes as expected
else
    print("doesn't work as expected")
end

# 2. Now compare matrix multiplication either this way A * B and this way A .* B. Whats the difference?!
#

mtxM = mtxA * mtxB
display(mtxM) # matrice multiplication

mtxM2 = mtxA .* mtxB 
display(mtxM2) # element-wise multiplication

# 3. What about matrix division with "/" or "\"?!
#
mtxD = mtxA / mtxB
display(mtxD) # matrice division

mtxD2 = mtxA \ mtxB 
display(mtxD2) # inverse divions (equals inv(mtxA) / inv(mtxB))

mtxD3 = inv(mtxA) / inv(mtxB)
display(mtxD3) # close to the same as mtxD2 (floating point inprecision)

mtxD4 = mtxB / mtxA
display(mtxD4) # not the same as mtxD3

# 4. Create a 3x3 integer matrix A with useful numbers. Now try A+1, A-1, A*2, A/2.
#
A = [0 1 2; 3 4 5; 6 7 8]

# elemntwise operations...
display( A + 1 )
display( A .+ 1 ) # same as before, so elementwise scalar addition
display( A - 1 )
display( A * 2 )
display( A / 2 ) # elementwise scalar division

# 5. Now multiply a 3x4 matrix with a suitable (4)vector.
#
B = [0 1 2 3; 4 5 6 7; 8 9 10 11]
V = [1, 2, 4, 8]

# matrix(3x4) multiplied with vector(4), results in vector(3)
display(B * V)

# elementwise, each matrix row is multiplied with the associated vector row, stays 3x4 matrix
display(B .* [1, 2, 4]) 
