# DS ESA5.1 Polczynski - Guess random number

# Windows line ending handling (else mixup of lines etc..)
loutput <- function(t) {
    writeLines(t, sep = "\r\n")
}

linput <- function(t) {
    loutput(t)
    return(readline())
}

again <- ""

while (again != "q")
{
    loutput("Guess number between 0 and 100!")

    randnum <- round(runif(1, min = 1, max = 100), 0)

    while (again != "q")
    {
        num <- ""

        # While no number was entered
        while (is.na(as.numeric(num)))
        {
            # read input from the user
            num <- linput("Enter Number:")
        }

        # convert to integer
        num <- as.integer(round(as.numeric(num), 0))

        if (num < randnum) {
            loutput(paste(num, " too small!"))
        }
        else if (num > randnum) {
            loutput(paste(num, " too big!"))
        }
        else
        {
            loutput(paste(num, " was correct!"))
            again <- linput("Again or quiet (q)?")

            # generate new number and start again
            if (again != "q")
            {
                break
            }
        }
    }
}
