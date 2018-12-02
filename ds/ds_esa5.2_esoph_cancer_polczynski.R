# DS ESA5.2 Polczynski - Explore esoph dataset

# Conclusions: (Deduced from graphic at end and middle)
# - Low amounts of alcohol have less an impact on cancer then tobacco
# - Even low amounts of tobacco have a high chance of cancer
# - High amounts of alcohol have a fast chance of cancer, tobacco takes longer to cause cancer
# - With higher age the chance of cancer grows

# Windows line ending handling (else mixup of lines etc..)
loutput <- function(t) {
    writeLines(t, sep = "\r\n")
}

linput <- function(t) {
    loutput(t)
    return(readline())
}

# Use data() to see all available datasets.
ed <- esoph # Smoking, Alcohol and (O)esophageal Cancer

# basic summary about data
loutput("Summary - Smoking, Alcohol and (O)esophageal Cancer:")
print(summary(esoph))

eds <- dim(ed)
loutput(paste("Rows ", eds[1], " Cols ", eds[2]))

# number of cancer cases in data
loutput(paste("Total cases ", sum(ed$ncases)))

# number of control data
loutput(paste("Total control cases", sum(ed$ncontrols)))

# for specific groups,
loutput(paste("Cases per amount of intake of alcohol:"))
alcohol <- aggregate(ncases ~ alcgp, ed, sum)
print(alcohol)

loutput(paste("ControlCases per amount of intake of alcohol:"))
alcohol2 <- aggregate(ncontrols ~ alcgp, ed, sum)
print(alcohol2)

loutput(paste("Cases per amount of intake of tobacco:"))
tobacco <- aggregate(ncases ~ tobgp, ed, sum)
print(tobacco)

loutput(paste("ControlCases per amount of intake of tobacco:"))
tobacco2 <- aggregate(ncontrols ~ tobgp, ed, sum)
print(tobacco2)

# Outputting of some interesting graphics
require(graphics)
 plot(ed$agegp, ed$ncases, main = "Cases per age group in dataset", xlab = "Age", ylab = "Cases")

plot(ed$agegp, ed$ncontrols, main = "Control cases per age group in dataset", xlab = "Age", ylab = "Cases")

# transform age label, add chance label, simple transform of amount
ed <- transform(ed,
                chance = ncases / (ncontrols+ncases),
                agegp = factor(agegp, levels = c("25-34", "35-44", "45-54", "55-64", "65-74", "75+"), labels = c(30, 40, 50, 60, 70, 80)),
                ntobgp = as.numeric(tobgp),
                nalcgp = as.numeric(alcgp),
                namountboth = (as.numeric(tobgp) + as.numeric(alcgp)) / 2
                )

print(summary(ed))

# Chance (Controlgroup vs Cases)
plot(ed$agegp, ed$chance, main = "Chance of cancer per age group in dataset (Controlgroup vs Cases)", xlab = "Age", ylab = "Chance")
plot(ed$tobgp, ed$chance, main = "Chance of cancer per tobacco amount in dataset (Controlgroup vs Cases)", xlab = "Amount", ylab = "Chance")
plot(ed$alcgp, ed$chance, main = "Chance of cancer per alcohol amount in dataset (Controlgroup vs Cases)", xlab = "Amount", ylab = "Chance")

plot(ed$namountboth, ed$chance, main = "Chance of cancer per total amount in dataset (Controlgroup vs Cases)", xlab = "Amount", ylab = "Chance")

# Bubblechart Plot of Age, Intake Amount and
# now based on https://www.r-graph-gallery.com/320-the-basis-of-bubble-plot/
install.packages("ggplot2")
library("ggplot2")

p1 <- ggplot(ed, aes(x = agegp, y = alcgp, size = chance)) + geom_point() + ggtitle("Alcohol intake cancer development chance in dataset") + xlab("Age") + ylab("Amount of intake") + labs(size = "Chance") +
    theme_bw() +
    theme(
    text = element_text(size = 20),
    panel.border = element_blank()
  )

p2 <- ggplot(ed, aes(x = agegp, y = tobgp, size = chance)) + geom_point() + ggtitle("Tobacco intake cancer development chance in dataset") + xlab("Age") + ylab("Amount of intake") + labs(size = "Chance") +
    theme_bw() +
    theme(
    text = element_text(size = 20),
    panel.border = element_blank()
  )

p3 <- ggplot(ed, aes(x = agegp, y = namountboth, size = chance)) + geom_point() + ggtitle("Combined Intake cancer development chance in dataset") + xlab("Age") + ylab("Amount of intake") + labs(size = "Chance") +
    theme_bw() +
    theme(
    text = element_text(size = 20),
    panel.border = element_blank()
  )

#now to put it all in one plot http://www.cookbook-r.com/Graphs/Multiple_graphs_on_one_page_(ggplot2)/
# Multiple plot function
#
# ggplot objects can be passed in ..., or to plotlist (as a list of ggplot objects)
# - cols:   Number of columns in layout
# - layout: A matrix specifying the layout. If present, 'cols' is ignored.
#
# If the layout is something like matrix(c(1,2,3,3), nrow=2, byrow=TRUE),
# then plot 1 will go in the upper left, 2 will go in the upper right, and
# 3 will go all the way across the bottom.
#
multiplot <- function(..., plotlist = NULL, file, cols = 1, layout = NULL) {
    library(grid)

    # Make a list from the ... arguments and plotlist
    plots <- c(list(...), plotlist)

    numPlots = length(plots)

    # If layout is NULL, then use 'cols' to determine layout
    if (is.null(layout)) {
        # Make the panel
        # ncol: Number of columns of plots
        # nrow: Number of rows needed, calculated from # of cols
        layout <- matrix(seq(1, cols * ceiling(numPlots / cols)),
                    ncol = cols, nrow = ceiling(numPlots / cols))
    }

    if (numPlots == 1) {
        print(plots[[1]])

    } else {
        # Set up the page
        grid.newpage()
        pushViewport(viewport(layout = grid.layout(nrow(layout), ncol(layout))))

        # Make each plot, in the correct location
        for (i in 1:numPlots) {
            # Get the i,j matrix positions of the regions that contain this subplot
            matchidx <- as.data.frame(which(layout == i, arr.ind = TRUE))

            print(plots[[i]], vp = viewport(layout.pos.row = matchidx$row,
                                      layout.pos.col = matchidx$col))
        }
    }
}

# Output of combined plot
multiplot(p1, p2, p3, layout = matrix(c(1, 2, 3, 3), nrow = 2, ncol = 2))
