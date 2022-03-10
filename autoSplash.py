
import os
import shutil
import csv

from treeexperiments2 import TreeNode2

from jinja2 import Template, Environment, FileSystemLoader
from pathlib import Path


# globals
csv2List=[]
# xVar = 0
# yVar = 0
flaglist=['root','video','folder']

defaultBackground =""
defaultLogo =""

splashfolderChk =  " ./splash"
if os.path.exists(splashfolderChk):
	try: 
		shutil.rmtree(splashfolderChk)
		print("deleted old splash folder")
	except: 
		print("did not/couldnt delte old splash folder")


# Building 2 dimensional list from csv
with open('./form.csv') as importedCSV:
    params = csv.reader(importedCSV)
       
    for line in params:
        nestedList = []
        # before appending to nested list check if back slashes covert double back slash
        for entries in line:
            entriesSlash = entries.replace("\\", "/")
            entries2 = entriesSlash.replace("N:/", "/n/")
		#extra step to make file paths easier work in unix . Remove for windows or change usage to pathlib
            nestedList.append(entries2)
        csv2List.append(nestedList)

    xVar = len(csv2List[0])
    yVar = len(csv2List)
    print ("global x and y are "+ str(xVar) + " "+ str(yVar))

# CREATING A STARTER NODE-----------

dummyList = {} # basically the data part of row, but just for the starter node
for entry in csv2List[0]:
    
    if entry == 'splash' or entry == 'root' or entry =='':
        continue
    else:
        
        if "logo" in entry:
            dummyList["logo"] = entry
            defaultLogo = entry
        elif "background" in entry or "bg" in entry:
            dummyList["background"] = entry
            defaultBackground = entry
# splashTree = TreeNode2("splashTree", 'root' , dummyList)  # The name for splash tree should point to the csv list -done

splashTree = TreeNode2(csv2List[0][0], 'root' , dummyList) 
splashTree.dataFinalStep()
splashTree.data['background']
print("create starter node out put is \n")
print(splashTree.data)
print("create starter node flag output is \n")
print(splashTree.flag)
print("create starter node logo output is \n")
print(splashTree.dataFinal['logo'])


# Finding parent in a nested for loop
def findparent (myList, y, x):
    while myList[y-1][x-1]=='':
        y-=1
    # print(myList[y-1][x-1])
    return myList[y-1][x-1]


def findData(myList, y,x):
    
    dataList = []
    dataDict ={}
    for num in range(x, xVar):
        if myList[y][num] == '':
            continue
        else: 
            dataList.append(myList[y][num])
    
    # code to create dictionary
    for entry in dataList:
        if ".jpg" in entry or ".png" in entry:
            if "logo" in entry:
                dataDict["logo"] = entry
            elif "background" in entry or "bg" in entry:
                dataDict["background"] = entry
            else:
                dataDict["card"] = entry
        else:
            dataDict["link"] = entry
    # -------------
    # code to check for defaults
    if "background" not in dataDict:
        dataDict["background"] = defaultBackground
    if "logo" not in dataDict:
        dataDict["logo"] = defaultLogo
    return dataDict
# end of findData function --------------------------------------------


#  findparent(csv2List, 7, 2)
# # test to see if data is correct caught
# print("\n test to see if data is correctly caught")
# print(findData(csv2List, 7, 2))
# print("\n end of test to see if data is correctly caught")


# This code is attaching a child node to a parent for that starter node we created

for y in range (yVar):
    
    for x in range(xVar):
        if x ==0 and y == 0:
            csv2List[y][x] = splashTree
            break
        elif csv2List[y][x] == '':
            continue
        else:
            cellParent = findparent(csv2List, y, x)
            csv2List[y][x] = TreeNode2(csv2List[y][x], csv2List[y][x+1], findData(csv2List, y, x+2))
            csv2List[y][x].dataFinalStep() 
            # step to make data jinja friendly
            cellParent.add_child(csv2List[y][x])
            break

print("\nchecking below parts of the splashtree \n")     
splashTree.print_tree()            
# print (splashTree)
# print(" below is the output of printing splashTree.children")
# print (splashTree.children)

# print("\n below is the full data output for the 2nd child of the splash tree")
# print("\n Final check of splash tree ")
# print (splashTree.children[1].data)
# print(splashTree.children[1].children[1].parent.data)
# print(splashTree.children[1].children[1].parent.data['link'])
# print(splashTree.children[1].children[1].parent.flag)




# function to build folder structure 
def folder_create(pathV, thisnode, totalc):
    tempPathVar=""
    try:
        os.makedirs(pathV)
    except Exception as e:
        print(e)
    try:
        cssPath = pathV + "/styles.css"
        fin = open('./templates/styles.css', 'r+')
        readText = fin.read()
        fout = open(cssPath,'a')
        
        tempPathVar = thisnode.data['background']
        print(" for foldercreate the background path is ")
        print(tempPathVar)
        justFile = tempPathVar.split('/')[-1]

        modText= readText.replace('backgroundImageHere', justFile)
        last_card = '#icon' + str(totalc-1) + \
        """.icon{
        display: block;
        margin-left: auto;
        margin-right: auto;
        }"""
        modText2= modText.replace('lastcardcode', last_card)
        # print(modText)
        fout.write(modText2)
        fin.close()
        fout.close()


 # Image copy behavior
 
        # static folder
        imagePath = pathV + "/images/"
        Path(imagePath).mkdir(parents = True, exist_ok = True)
        print(" imagePath created ")
        
        
        for key in thisnode.data:
            # if not "link":
            print(key)
            if key != "link":
                justFile2 = thisnode.data[key].split('/')[-1]
                copyoverPath = imagePath + justFile2
                shutil.copyfile(thisnode.data[key], copyoverPath)
                print(" \n copied over the image file" + justFile2 +"into the directory")
                print(" \n copied over the image file %s into the directory" % justFile2)

                
    # except OSError:
    except Exception as e:
        print("Creation of library %s failed" % pathV)
        print(e)
    else: 
        print("Successfully createdthe directory %s " % pathV)
# end of folder_create---------------------------------------------------


# jinja handling of html template. Common step for dict
file_loader = FileSystemLoader('templates')
env = Environment(loader=file_loader)
template02=env.get_template('jinjaTemplate.html')
# change below to pull this information out from the csv!!!
property_name = " The bland houses"


thisFolder = '.'
def treeRecur2(myNode, dot_path):
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$check")
    print(myNode.name)
    print([x.name for x in myNode.children])
    if not myNode.children :
        print (" video: " + myNode.name)
                
    else: 
        print(" folder named " + myNode.name)
        print("number of childrent in " + myNode.name + " is " + str(len(myNode.children)))
        # code to center align in css
        if len(myNode.children)%2 == 0:
            totalCards = 999
        else:
            totalCards = len(myNode.children)
        for kid in myNode.children:
            pathvar = dot_path + '/'+  myNode.name
            folder_create(pathvar, kid, totalCards)
            
        
            outputf2 = template02.render(tmList = myNode.children, property_name= property_name, logoVar = myNode.dataFinal["logo"])
            # print(outputf2)
            # above for testing what is spit out in the html files

            indexPath = pathvar + "/index.html"

            with open(indexPath,"w") as pf:
                pf.write(outputf2)
        
            treeRecur2(kid, pathvar)
    

# Function calling the creation of the splash folder structure
print("below is output for recur2----------")
treeRecur2(splashTree, thisFolder)

# print("\nsplashTree child1 data0 is " + splashTree.children[1].data[0])
# print("\nsplashTree child1 data1 is " + splashTree.children[1].data[1])
# print("\nsplashTree flag is " + splashTree.flag)
# print("\nsplashTree data[0] is " + splashTree.data[0])
# print("\nsplashTree data[1] is " + splashTree.data[1])
# # print("\nsplashTree data[2] is " + splashTree.data[2])
# print("\nsplashTree name is " + splashTree.name)


