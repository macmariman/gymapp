# shadcn/ui Components Documentation

## Table of Contents

- [Theming Guide](#theming-guide)
- [Accordion](#accordion)
- [Alert](#alert)
- [Alert Dialog](#alert-dialog)
- [Aspect Ratio](#aspect-ratio)
- [Avatar](#avatar)
- [Badge](#badge)
- [Breadcrumb](#breadcrumb)
- [Button](#button)
- [Calendar](#calendar)
- [Card](#card)
- [Carousel](#carousel)
- [Checkbox](#checkbox)
- [Collapsible](#collapsible)
- [Combobox](#combobox)
- [Command](#command)
- [Context Menu](#context-menu)
- [Data Table](#data-table)
- [Date Picker](#date-picker)
- [Dialog](#dialog)
- [Drawer](#drawer)
- [Dropdown Menu](#dropdown-menu)
- [React Hook Form](#react-hook-form)
- [Hover Card](#hover-card)
- [Input](#input)
- [Input OTP](#input-otp)
- [Label](#label)
- [Menubar](#menubar)
- [Navigation Menu](#navigation-menu)
- [Pagination](#pagination)
- [Popover](#popover)
- [Progress](#progress)
- [Radio Group](#radio-group)
- [Resizable](#resizable)
- [Scroll Area](#scroll-area)
- [Select](#select)
- [Separator](#separator)
- [Sheet](#sheet)
- [Sidebar](#sidebar)
- [Chart](#chart)
- [Skeleton](#skeleton)
- [Slider](#slider)
- [Sonner](#sonner)
- [Switch](#switch)
- [Table](#table)
- [Tabs](#tabs)
- [Textarea](#textarea)
- [Toast](#toast)
- [Toggle](#toggle)
- [Toggle Group](#toggle-group)
- [Tooltip](#tooltip)
- [Typography](#typography)

This document provides a comprehensive overview of the shadcn/ui components, including installation instructions, usage examples, and best practices.

---

## Theming Guide

### Dark Mode Support

All shadcn/ui components are designed to work with both light and dark modes using CSS variables and Tailwind's theming system. To ensure proper dark mode support, follow these guidelines:

#### 1. Use Semantic Color Classes

Always use semantic color classes instead of hard-coded colors:

| ✅ Use These | ❌ Avoid These |
| ------------ | ------------- |
| `bg-background` | `bg-white` |
| `bg-card` | `bg-slate-50` |
| `text-foreground` | `text-black` |
| `text-muted-foreground` | `text-gray-500` |
| `bg-destructive/20 text-destructive` | `bg-red-100 text-red-800` |
| `bg-primary/20 text-primary` | `bg-blue-100 text-blue-800` |

#### 2. Component Background and Foreground

Follow the background/foreground convention for all components:

- Use `bg-{component}` for the background color
- Use `text-{component}-foreground` for the text color

Example:
```tsx
<div className="bg-primary text-primary-foreground">Button Text</div>
```

#### 3. Available Theme Variables

These are the main CSS variables available for theming:

```css
:root {
  /* Base colors */
  --background: /* Light mode background */;
  --foreground: /* Light mode text */;
  
  /* Component colors */
  --card: /* Card background */;
  --card-foreground: /* Card text */;
  --popover: /* Popover background */;
  --popover-foreground: /* Popover text */;
  --primary: /* Primary elements */;
  --primary-foreground: /* Text on primary elements */;
  --secondary: /* Secondary elements */;
  --secondary-foreground: /* Text on secondary elements */;
  --muted: /* Muted elements */;
  --muted-foreground: /* Text on muted elements */;
  --accent: /* Accent elements */;
  --accent-foreground: /* Text on accent elements */;
  --destructive: /* Destructive elements */;
  --destructive-foreground: /* Text on destructive elements */;
  
  /* Border and UI colors */
  --border: /* Border color */;
  --input: /* Input border */;
  --ring: /* Focus ring */;
}

.dark {
  /* Dark mode overrides */
  --background: /* Dark mode background */;
  --foreground: /* Dark mode text */;
  /* ... other dark mode variables */
}
```

#### 4. Common Issues and Solutions

| Issue | Solution |
| ----- | -------- |
| Text not visible in dark mode | Replace `text-gray-500` with `text-muted-foreground` |
| Background too bright in dark mode | Replace `bg-white` with `bg-card` or `bg-background` |
| Colored elements don't adapt | Use `bg-primary/20` instead of `bg-blue-100` |
| Pre/code blocks unreadable | Use `bg-muted text-foreground` instead of fixed colors |

#### 5. Testing Dark Mode

Always test your components in both light and dark modes before committing changes. Use the theme toggle in the application to switch between modes during development.

---

## Accordion

A vertically stacked set of interactive headings that each reveal a section of content.

### Installation

```bash
npx shadcn@latest add accordion
```

### Usage

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function AccordionDemo() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other
          components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

### Best Practices

*   **Single vs. Multiple Open:** Use `type="single"` to allow only one item to be open at a time. Use `type="multiple"` to allow multiple items to be open simultaneously.
*   **Collapsible:** The `collapsible` prop allows all items to be closed.
*   **Accessibility:** The component is built on top of Radix UI's Accordion primitive and follows the WAI-ARIA design pattern, making it accessible out of the box.
*   **Customization:** You can easily customize the styles of the `AccordionTrigger`, `AccordionContent`, and `AccordionItem` components to match your application's design system.

---

## Alert

Displays a callout for user attention.

### Installation

```bash
npx shadcn@latest add alert
```

### Usage

```tsx
import {
  AlertCircle,
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export function AlertDestructive() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  )
}
```

### Best Practices

*   **Variants:** Use the `variant` prop to change the alert's appearance. The default is a neutral style, while `destructive` is used for errors or critical warnings.
*   **Icons:** Include an icon to visually reinforce the message's intent (e.g., an error icon for a destructive alert).
*   **Clarity:** Keep the `AlertTitle` and `AlertDescription` concise and to the point. The user should be able to understand the message at a glance.

---

## Alert Dialog

A modal dialog that interrupts the user with important content and expects a response.

### Installation

```bash
npx shadcn@latest add alert-dialog
```

### Usage

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Show Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Best Practices

*   **Destructive Actions:** Use `AlertDialog` for actions that are destructive or irreversible, such as deleting an account or discarding a draft.
*   **Clear Messaging:** The `AlertDialogTitle` and `AlertDialogDescription` should clearly explain the action and its consequences.
*   **Action Buttons:** Provide clear actions for the user, such as "Continue" and "Cancel". The `AlertDialogAction` is the primary action, and `AlertDialogCancel` is the secondary action.

---

## Aspect Ratio

Displays content within a desired ratio.

### Installation

```bash
npx shadcn@latest add aspect-ratio
```

### Usage

```tsx
import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"

export function AspectRatioDemo() {
  return (
    <AspectRatio ratio={16 / 9} className="bg-muted">
      <Image
        src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
        alt="Photo by Drew Beamer"
        fill
        className="rounded-md object-cover"
      />
    </AspectRatio>
  )
}
```

### Best Practices

*   **Responsive Images:** Use `AspectRatio` to maintain the aspect ratio of images and videos across different screen sizes.
*   **Placeholders:** It can be used to create placeholder elements that reserve space for content that will be loaded later.
*   **Next.js Image:** When using with `next/image`, ensure you use the `fill` prop on the `Image` component and contain it within the `AspectRatio` component.

---

## Avatar

An image element with a fallback for representing the user.

### Installation

```bash
npx shadcn@latest add avatar
```

### Usage

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
```

### Best Practices

*   **Fallback Content:** Always provide a fallback component (`AvatarFallback`) for cases where the image (`AvatarImage`) fails to load. This can be the user's initials or a generic icon.
*   **Accessibility:** Include an `alt` prop on the `AvatarImage` to provide a textual description of the image for screen readers.
*   **Styling:** You can customize the size and shape of the avatar by applying standard CSS classes to the `Avatar` component.

---

## Badge

Displays a badge or a component that looks like a badge.

### Installation

```bash
npx shadcn@latest add badge
```

### Usage

```tsx
import { Badge } from "@/components/ui/badge"

export function BadgeDemo() {
  return <Badge>Badge</Badge>
}
```

### Best Practices

*   **Variants:** Use the `variant` prop to change the badge's appearance. Available variants are `default`, `secondary`, `destructive`, and `outline`.
*   **As Child:** Use the `asChild` prop to render the badge as a different component, such as a link.
*   **Icons:** Badges can include icons to provide additional context.

---

## Breadcrumb

Displays the path to the current resource using a hierarchy of links.

### Installation

```bash
npx shadcn@latest add breadcrumb
```

### Usage

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function BreadcrumbDemo() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/components">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

### Best Practices

*   **Routing:** Use a custom link component from your routing library (like Next.js) by using the `asChild` prop on `BreadcrumbLink`.
*   **Custom Separator:** You can provide a custom component or icon as a child to `BreadcrumbSeparator` to change the separator.
*   **Collapsed Items:** For long breadcrumb trails, use the `BreadcrumbEllipsis` component to create a collapsed state. This can be combined with a `DropdownMenu` to show the hidden items.
*   **Responsiveness:** Combine `BreadcrumbEllipsis` with a `DropdownMenu` for desktop and a `Drawer` for mobile to create a fully responsive breadcrumb component.

---

## Button

Displays a button or a component that looks like a button.

### Installation

```bash
npx shadcn@latest add button
```

### Usage

```tsx
import { Button } from "@/components/ui/button"

export function ButtonDemo() {
  return <Button>Button</Button>
}
```

### Variants

The button comes with a few variants that you can use to style it:
- **Default:** `<Button>Default</Button>`
- **Secondary:** `<Button variant="secondary">Secondary</Button>`
- **Destructive:** `<Button variant="destructive">Destructive</Button>`
- **Outline:** `<Button variant="outline">Outline</Button>`
- **Ghost:** `<Button variant="ghost">Ghost</Button>`
- **Link:** `<Button variant="link">Link</Button>`

### Other Examples

- **With Icon:**
  ```tsx
  import { Mail } from "lucide-react"
  import { Button } from "@/components/ui/button"

  export function ButtonWithIcon() {
    return (
      <Button>
        <Mail className="mr-2 h-4 w-4" /> Login with Email
      </Button>
    )
  }
  ```

- **Icon only:**
  ```tsx
  import { ChevronRightIcon } from "lucide-react"
  import { Button } from "@/components/ui/button"

  export function ButtonIcon() {
    return (
      <Button variant="outline" size="icon">
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    )
  }
  ```

- **Loading state:**
  ```tsx
  import { Loader2 } from "lucide-react"
  import { Button } from "@/components/ui/button"

  export function ButtonLoading() {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Please wait
      </Button>
    )
  }
  ```

### Best Practices

*   **As Link:** Use the `asChild` prop to render the button as a link (`<a>`) or another component, while preserving the button's styling. This is useful for navigation.
*   **Accessibility:** When using an icon-only button, provide an accessible label via `aria-label` or by including screen-reader-only text.
*   **Loading State:** Disable the button and show a loading indicator (like a spinner) when an action is in progress to prevent multiple submissions and provide user feedback.

---

## Calendar

A date field component that allows users to enter and edit a date.

### Installation

```bash
npx shadcn@latest add calendar
```

### Usage

```tsx
"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
    />
  )
}
```

### Examples

- **Date Picker**

  A common use case is to use the calendar with a popover to create a date picker.

  ```tsx
  "use client"

  import * as React from "react"
  import { format } from "date-fns"
  import { Calendar as CalendarIcon } from "lucide-react"

  import { cn } from "@/lib/utils"
  import { Button } from "@/components/ui/button"
  import { Calendar } from "@/components/ui/calendar"
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"

  export function DatePickerDemo() {
    const [date, setDate] = React.useState<Date>()

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }
  ```

- **Form Integration**

  Integrate the calendar with `react-hook-form` and `zod` for robust form validation.

  ```tsx
  "use client"

  import { zodResolver } from "@hookform/resolvers/zod"
  import { format } from "date-fns"
  import { CalendarIcon } from "lucide-react"
  import { useForm } from "react-hook-form"
  import { z } from "zod"

  import { cn } from "@/lib/utils"
  import { Button } from "@/components/ui/button"
  import { Calendar } from "@/components/ui/calendar"
  import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form"
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"

  const FormSchema = z.object({
    dob: z.date({
      required_error: "A date of birth is required.",
    }),
  })

  export function CalendarForm() {
    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
      // Handle form submission
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Your date of birth is used to calculate your age.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    )
  }
  ```

### Best Practices

*   **Date Picker Pattern:** For a user-friendly experience, wrap the `Calendar` in a `Popover` triggered by a `Button`. This is the most common implementation.
*   **Form Integration:** When using in a form, leverage libraries like `react-hook-form` and `zod` for validation and state management.
*   **Accessibility:** Ensure that the date picker is fully keyboard accessible and that selected dates are announced by screen readers.
*   **Localization:** The calendar is built on `react-day-picker`, which supports localization. Refer to its documentation to implement different locales.

---

## Card

Displays a card with header, content, and footer.

### Installation

```bash
npx shadcn@latest add card
```

### Usage

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card, where you can place forms, text, or other components.</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer for actions or supplemental information.</p>
      </CardFooter>
    </Card>
  )
}
```

### Best Practices

*   **Semantic Structure:** Use `CardHeader`, `CardContent`, and `CardFooter` to organize your content semantically. This improves accessibility and readability.
*   **Consistency:** Use cards to present items in a list or grid in a consistent format, which helps users scan and compare information easily.
*   **Conciseness:** Keep the content within a card brief and to the point. For more detailed information, link to a separate page.
*   **Actions:** Place primary actions, like buttons, within the `CardFooter` for a clear and predictable user experience.

---

## Carousel

A carousel with motion and swipe built using Embla.

### Installation

```bash
npx shadcn@latest add carousel
```

### Usage

```tsx
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function CarouselDemo() {
  return (
    <Carousel className="w-full max-w-xs">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
```

### Examples

- **Responsive Sizing**

  You can control the number of items per view by using Tailwind CSS utility classes on the `CarouselItem`.

  ```tsx
  //... imports
  export function CarouselSize() {
    return (
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full max-w-sm"
      >
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    )
  }
  ```

### Best Practices

*   **Responsive Design:** Use responsive utility classes (e.g., `md:basis-1/2`, `lg:basis-1/3`) on `CarouselItem` to control how many items are visible on different screen sizes.
*   **Options:** Customize the carousel's behavior by passing options to the `opts` prop on the `Carousel` component. Refer to the [Embla Carousel API documentation](https://www.embla-carousel.com/api/options/) for a full list of options.
*   **Navigation:** Always include `CarouselPrevious` and `CarouselNext` to ensure the carousel is navigable, unless it's a non-interactive, auto-playing carousel.
*   **Accessibility:** Ensure that interactive elements within the carousel are focusable and that the carousel is keyboard navigable.

---

## Checkbox

A control that allows the user to toggle between checked and not checked.

### Installation

```bash
npx shadcn@latest add checkbox
```

### Usage

```tsx
import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxDemo() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </label>
    </div>
  )
}
```

### Examples

- **Form (Multiple)**

  The following is an example of using multiple checkboxes within a `react-hook-form` to allow the user to select multiple items.

  ```tsx
  "use client"

  import { zodResolver } from "@hookform/resolvers/zod"
  import { useForm } from "react-hook-form"
  import { z } from "zod"
  import { Button } from "@/components/ui/button"
  import { Checkbox } from "@/components/ui/checkbox"
  import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form"

  const items = [
    { id: "recents", label: "Recents" },
    { id: "home", label: "Home" },
    { id: "applications", label: "Applications" },
    { id: "desktop", label: "Desktop" },
    { id: "downloads", label: "Downloads" },
    { id: "documents", label: "Documents" },
  ] as const

  const FormSchema = z.object({
    items: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "You have to select at least one item.",
    }),
  })

  export function CheckboxReactHookFormMultiple() {
    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        items: ["recents", "home"],
      },
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
      // Handle form submission
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="items"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Sidebar</FormLabel>
                  <FormDescription>
                    Select the items you want to display in the sidebar.
                  </FormDescription>
                </div>
                {items.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="items"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    )
  }
  ```

### Best Practices

*   **Accessibility:** Always use a `label` with the `htmlFor` attribute pointing to the `id` of the `Checkbox`. This improves screen reader support and increases the clickable area.
*   **Controlled Component:** Manage the `checked` state of the checkbox in React state and update it using the `onCheckedChange` callback.
*   **Form Integration:** For forms, use the `Checkbox` component inside a `FormField` from `react-hook-form` to handle state, validation, and submission seamlessly.
*   **Disabled State:** Use the `disabled` prop to prevent interaction when the checkbox is not applicable.

---

## Collapsible

An interactive component which expands/collapses a panel.

### Installation

```bash
npx shadcn@latest add collapsible
```

### Usage

```tsx
"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function CollapsibleDemo() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-[350px] space-y-2"
    >
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">
          @peduarte starred 3 repositories
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-3 font-mono text-sm">
        @radix-ui/primitives
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @radix-ui/colors
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @stitches/react
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### Best Practices

*   **Controlled Component:** For more complex scenarios, manage the open/closed state using React's `useState` hook and pass it to the `open` and `onOpenChange` props.
*   **Custom Trigger:** Use the `asChild` prop on `CollapsibleTrigger` to render a custom component, such as a `Button` with an icon, as the trigger element.
*   **Accessibility:** When using an icon-only trigger, include a screen-reader-only text (e.g., `<span className="sr-only">Toggle</span>`) to provide an accessible label.
*   **Animation:** The component is animated by default. The animation can be customized using Tailwind CSS classes.

---

## Combobox

Autocomplete input and command palette with a list of suggestions.

### Installation

The Combobox is built by composing the `Popover` and `Command` components. You need to install both.

```bash
npx shadcn@latest add popover
npx shadcn@latest add command
```

### Usage

```tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

export function ComboboxDemo() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select framework..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandEmpty>No framework found.</CommandEmpty>
          <CommandGroup>
            {frameworks.map((framework) => (
              <CommandItem
                key={framework.value}
                value={framework.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === framework.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {framework.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### Best Practices

*   **State Management:** Use React state to manage the `open` state of the popover and the selected `value` of the combobox.
*   **Accessibility:** Ensure the trigger `Button` has `role="combobox"` and `aria-expanded` to provide the correct context for screen readers.
*   **Search Functionality:** The `CommandInput` provides a built-in search and filter functionality for the list of items.
*   **Empty State:** Use `CommandEmpty` to display a message to the user when no results match their search query.

---

## Command

Fast, composable, unstyled command menu for React.

### Installation

```bash
npx shadcn@latest add command
```

### Usage

```tsx
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandDemo() {
  return (
    <Command>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Profile</CommandItem>
          <CommandItem>Billing</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
```

### Examples

- **Command Palette (Dialog)**

  A common use case is to render the command menu in a dialog. You can use the `CommandDialog` component for this.

  ```tsx
  "use client"

  import * as React from "react"
  import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
  } from "lucide-react"

  import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
  } from "@/components/ui/command"

  export function CommandDialogDemo() {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          setOpen((open) => !open)
        }
      }

      document.addEventListener("keydown", down)
      return () => document.removeEventListener("keydown", down)
    }, [])

    return (
      <>
        <p className="text-sm text-muted-foreground">
          Press{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>J
          </kbd>
        </p>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem>
                <Smile className="mr-2 h-4 w-4" />
                <span>Search Emoji</span>
              </CommandItem>
              <CommandItem>
                <Calculator className="mr-2 h-4 w-4" />
                <span>Calculator</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    )
  }
  ```

### Best Practices

*   **Keyboard Shortcuts:** Implement keyboard shortcuts (e.g., `⌘J`) to open the command palette for a better user experience.
*   **Structure:** Use `CommandGroup` to group related items and `CommandSeparator` to visually divide the groups.
*   **Icons and Shortcuts:** Add icons to `CommandItem` for visual cues and `CommandShortcut` to display keyboard shortcuts for specific actions.
*   **Dialog vs. Inline:** Use `CommandDialog` for a global command palette and the standard `Command` component for inline command menus like a combobox.

---

## Context Menu

Displays a menu to the user — such as a set of actions or functions — triggered by a right-click.

### Installation

```bash
npx shadcn@latest add context-menu
```

### Usage

```tsx
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export function ContextMenuDemo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem inset>
          Back
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset disabled>
          Forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          Reload
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              Save Page As...
              <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Create Shortcut...</ContextMenuItem>
            <ContextMenuItem>Name Window...</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Developer Tools</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>
          Show Bookmarks Bar
          <ContextMenuShortcut>⇧⌘B</ContextMenuShortcut>
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value="pedro">
          <ContextMenuLabel inset>People</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
          <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
```

### Best Practices

*   **Trigger Area:** The `ContextMenuTrigger` should wrap the element that users will right-click. Ensure this area is clearly defined and large enough for easy interaction.
*   **Complex Menus:** Use `ContextMenuSub` for nested menus, `ContextMenuCheckboxItem` for togglable options, and `ContextMenuRadioGroup` for single-choice selections.
*   **Separators:** Use `ContextMenuSeparator` to group related items and improve readability.
*   **Shortcuts:** Provide `ContextMenuShortcut` to display keyboard shortcuts for actions, improving usability for power users.
*   **Disabled Items:** Use the `disabled` prop on `ContextMenuItem` to indicate actions that are not currently available.

---

## Data Table

A powerful and customizable table component built using TanStack Table. Unlike other components, `Data Table` is not a single component but a guide on how to build your own flexible and powerful data grids from scratch.

This guide covers building a basic table. Advanced features like pagination, sorting, filtering, and row selection are also supported and can be added incrementally.

### 1. Installation

First, you need to add the `Table` component and the `TanStack Table` library to your project.

```bash
# 1. Add the Table component
npx shadcn@latest add table

# 2. Add the TanStack Table library
npm install @tanstack/react-table
```

### 2. Project Structure

For this guide, we'll build a table to display a list of payments. It's recommended to structure your files as follows:

```
app/
└── payments/
    ├── columns.tsx          # Defines table columns
    ├── data-table.tsx       # The reusable DataTable component
    └── page.tsx             # Fetches data and renders the table
```

### 3. Define the Columns

In `columns.tsx`, define the data structure and the columns for your table. Columns determine what data is shown and how it's formatted.

**`app/payments/columns.tsx`**:
```tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
]
```

### 4. Create the Data Table Component

Next, in `data-table.tsx`, create a reusable `DataTable` component that will render the table using the columns and data you provide.

**`app/payments/data-table.tsx`**:
```tsx
"use client"

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 5. Render the Table

Finally, in `page.tsx`, fetch your data and render the `DataTable` component, passing the columns and data as props.

**`app/payments/page.tsx`**:
```tsx
import { Payment, columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    {
      id: "489e1d42",
      amount: 125,
      status: "processing",
      email: "example@gmail.com",
    },
    // ... more payments
  ]
}

export default async function DemoPage() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
```

### Best Practices

*   **Component Structure:** Separating the logic into `columns.tsx`, `data-table.tsx`, and `page.tsx` makes the code more modular, reusable, and easier to maintain.
*   **Data Fetching:** Keep data-fetching logic separate from your display components. In Next.js, this is typically done in Server Components (`page.tsx`).
*   **Generics:** The `DataTable` component uses generics (`<TData, TValue>`) to remain type-safe and reusable for any data structure.
*   **Extensibility:** This basic setup is the foundation for adding more advanced features like sorting, filtering, and pagination, which are all supported by TanStack Table.

---

## Date Picker

A date picker component with range and presets.

### Installation

The Date Picker is built by composing the `Popover` and `Calendar` components and uses `date-fns` for date formatting. You need to install all three.

```bash
# 1. Install components
npx shadcn@latest add popover
npx shadcn@latest add calendar

# 2. Install date-fns
npm install date-fns
```

### Usage

Here's a basic example of a date picker.

```tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
```

### Example: With a Form

Here's how to integrate the date picker with `react-hook-form` and `zod` for validation.

```tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const FormSchema = z.object({
  dob: z.date({
    required_error: "A date of birth is required.",
  }),
})

export function DatePickerForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // Handle form submission
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Your date of birth is used to calculate your age.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Best Practices

*   **Dependencies:** Remember that this component is a composition of `Popover` and `Calendar`, and requires `date-fns` for formatting. All must be installed.
*   **Controlled Component:** Use the `useState` hook to manage the selected date in a controlled manner.
*   **Form Integration:** When using with `react-hook-form`, wrap the component in a `FormField` to connect it to the form's state and validation.
*   **Date Disabling:** Use the `disabled` prop on the `Calendar` component to prevent users from selecting invalid dates (e.g., dates in the future for a date of birth).
*   **Accessibility:** Use `initialFocus` on the `Calendar` to ensure a good keyboard navigation experience when the popover opens.

---

## Dialog

A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.

### Installation

```bash
npx shadcn@latest add dialog
```

### Usage

Here's a basic example of a dialog.

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
```

### Example: With Custom Close Button

This example shows how to create a dialog with form elements and a custom close button inside a `DialogFooter`.

```tsx
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DialogCloseButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Share</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>
            Anyone who has this link will be able to view this.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue="https://ui.shadcn.com/docs/installation"
              readOnly
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Best Practices

*   **Accessibility:** Always include a `DialogTitle` and `DialogDescription` to provide context for screen reader users.
*   **Trigger:** The `DialogTrigger` component is used to open the dialog. It should wrap the element that triggers the dialog, such as a button.
*   **Content Structure:** Use `DialogHeader`, `DialogContent`, and `DialogFooter` to semantically structure the content within the dialog.
*   **Closing the Dialog:** The dialog can be closed by clicking the overlay, pressing the `Escape` key, or by using the `DialogClose` component, which is useful for creating custom close buttons.

---

## Drawer

A drawer component that slides in from the side of the screen, built on top of Vaul.

### Installation

```bash
npx shadcn@latest add drawer
```

### Usage

Here's a basic example of a drawer.

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

export function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
```

### Example: Responsive Dialog/Drawer

You can combine the `Dialog` and `Drawer` components to create a responsive experience. This example renders a `Dialog` on desktop (screens wider than 768px) and a `Drawer` on mobile.

This pattern requires a `useMediaQuery` hook. If you don't have one, you can create it in `src/hooks/use-media-query.ts`.

```tsx
"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export function ResponsiveDrawerDialog() {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Edit Profile</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {/* Your Form Component Here */}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>
            Make changes to your profile here. Click save when you're done.
          </DrawerDescription>
        </DrawerHeader>
        {/* Your Form Component Here */}
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
```

### Best Practices

*   **Responsive Design:** The combination of `Drawer` for mobile and `Dialog` for desktop provides a great user experience. Use a `useMediaQuery` hook to toggle between them.
*   **State Management:** Use a single `useState` hook to control the open/closed state for both the `Drawer` and `Dialog` to keep them in sync.
*   **Semantic Structure:** Use the provided sub-components like `DrawerHeader`, `DrawerContent`, and `DrawerFooter` to organize your content semantically.
*   **Underlying Library:** The `Drawer` is built on `Vaul`. For advanced customization, you can refer to the `Vaul` documentation.

---

## Dropdown Menu

Displays a menu to the user — such as a set of actions or functions — triggered by a button.

### Installation

```bash
npx shadcn@latest add dropdown-menu
```

### Usage

Here's a basic example of a dropdown menu.

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Team</DropdownMenuItem>
        <DropdownMenuItem>Subscription</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Example: With Checkboxes

Dropdown menus can contain checkbox items to toggle settings.

```tsx
"use client"

import * as React from "react"
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Checked = DropdownMenuCheckboxItemProps["checked"]

export function DropdownMenuCheckboxes() {
  const [showStatusBar, setShowStatusBar] = React.useState<Checked>(true)
  const [showActivityBar, setShowActivityBar] = React.useState<Checked>(false)
  const [showPanel, setShowPanel] = React.useState<Checked>(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Appearance</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showStatusBar}
          onCheckedChange={setShowStatusBar}
        >
          Status Bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showActivityBar}
          onCheckedChange={setShowActivityBar}
          disabled
        >
          Activity Bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showPanel}
          onCheckedChange={setShowPanel}
        >
          Panel
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Example: With Radio Group

Use a radio group to manage a single selection from a list of options.

```tsx
"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DropdownMenuRadioGroupDemo() {
  const [position, setPosition] = React.useState("bottom")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Best Practices

*   **Trigger:** Use `asChild` on the `DropdownMenuTrigger` to pass its properties to a child component, usually a `Button`.
*   **Organization:** Use `DropdownMenuLabel` and `DropdownMenuSeparator` to group related items and improve clarity.
*   **Stateful Items:** For interactive items like `DropdownMenuCheckboxItem` and `DropdownMenuRadioGroup`, use `useState` to manage their state.
*   **Complex Content:** You can nest sub-menus using `DropdownMenuSub` for more complex navigation.

---

## React Hook Form

Guidance on building accessible and reusable forms using `react-hook-form` and `zod`.

### Installation

First, add the `Form` component to your project. Then, install `react-hook-form`, its resolver, and `zod`.

```bash
# 1. Add the form component
npx shadcn@latest add form

# 2. Install dependencies
npm install react-hook-form @hookform/resolvers zod
```

### Usage

Building a form involves three main steps:

**1. Create a form schema with Zod**

Define the shape and validation rules of your form.

```tsx
"use client"

import { z } from "zod"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})
```

**2. Define the form with `useForm`**

Set up the form, connect the Zod schema for validation, and define default values and a submit handler.

```tsx
// ... inside your component

// 1. Define your form.
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    username: "",
  },
})

// 2. Define a submit handler.
function onSubmit(values: z.infer<typeof formSchema>) {
  // Do something with the form values.
  // ✅ This will be type-safe and validated.
  console.log(values)
}
```

**3. Build the form structure**

Use the `Form` and `FormField` components to construct the form UI.

```tsx
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// ... inside your component's return statement

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input placeholder="shadcn" {...field} />
          </FormControl>
          <FormDescription>
            This is your public display name.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

### Best Practices

*   **Schema-Driven Validation:** Define all validation logic in your Zod schema to keep it centralized and maintainable.
*   **Component Composition:** Use the `FormField` component to wrap each input. Inside, compose `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, and `FormMessage` to create well-structured, accessible form fields.
*   **Type Safety:** Infer your form's type from the Zod schema (`z.infer<typeof formSchema>`) to ensure full type safety in your form values and submit handler.
*   **Error Handling:** The `FormMessage` component will automatically display validation errors for its corresponding field, so there's no need for manual error handling in the UI.

---

## Hover Card

For sighted users to preview content available behind a link.

### Installation

```bash
npx shadcn@latest add hover-card
```

### Usage

A hover card is useful for showing additional information, like a user's profile, without navigating away from the page.

```tsx
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function HoverCardDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <p className="text-sm">
              The React Framework – created and maintained by @vercel.
            </p>
            <div className="flex items-center pt-2">
              <span className="text-xs text-muted-foreground">
                Joined December 2021
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
```

### Best Practices

*   **Use for Non-Critical Information:** Hover cards are best for supplementary details. Don't place essential actions or information inside them, as they are not accessible to keyboard-only or mobile users.
*   **Keep Content Concise:** The content within a `HoverCard` should be brief and easy to scan.
*   **Clear Trigger:** Ensure the `HoverCardTrigger` is an element that clearly implies interactivity, such as a link or a button.

---

## Input

Displays a form input field or a component that looks like an input field.

### Installation

```bash
npx shadcn@latest add input
```

### Usage

A basic text input field.

```tsx
import { Input } from "@/components/ui/input"

export function InputDemo() {
  return <Input type="email" placeholder="Email" />
}
```

### Example: With Label

For accessibility, always pair an input with a `Label`.

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InputWithLabel() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  )
}
```

### Example: File Input

The input component can be used for file uploads.

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InputFile() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" />
    </div>
  )
}
```

### Example: With Button

Combine an input with a button for actions like submitting a form or subscribing.

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function InputWithButton() {
  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input type="email" placeholder="Email" />
      <Button type="submit">Subscribe</Button>
    </div>
  )
}
```

### Example: Form Integration

The `Input` component is designed to work seamlessly with the `Form` component.

```tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

export function InputForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values:", {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Best Practices

*   **Accessibility:** Always use a `Label` with the `htmlFor` attribute pointing to the input's `id` to ensure screen readers can associate them.
*   **Controlled Component:** When used within a form, treat the `Input` as a controlled component, managing its state through the form library (e.g., `React Hook Form`).
*   **Input Types:** Use the appropriate `type` attribute (e.g., `email`, `password`, `file`) to leverage browser-native features and validation.

---

## Input OTP

An accessible one-time password component with copy-paste functionality.

### Installation

```bash
npx shadcn@latest add input-otp
```

### Usage

A basic example of an OTP input with 6 slots.

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function InputOTPDemo() {
  return (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
```

### Example: Controlled

You can control the input's value using `useState`.

```tsx
"use client"

import * as React from "react"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function InputOTPControlled() {
  const [value, setValue] = React.useState("")

  return (
    <div className="space-y-2">
      <InputOTP
        maxLength={6}
        value={value}
        onChange={(value) => setValue(value)}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <div className="text-center text-sm">
        {value === "" ? (
          <>Enter your one-time password.</>
        ) : (
          <>You entered: {value}</>
        )}
      </div>
    </div>
  )
}
```

### Example: Form Integration

The component integrates seamlessly with `react-hook-form`.

```tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
})

export function InputOTPForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values:", {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>One-Time Password</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormDescription>
                Please enter the one-time password sent to your phone.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Best Practices

*   **Structure:** Use `InputOTPGroup` to group slots and `InputOTPSeparator` to add visual separation between groups.
*   **Validation:** Use the `pattern` prop with a regex (e.g., `REGEXP_ONLY_DIGITS_AND_CHARS` from `input-otp`) for client-side validation.
*   **Form Integration:** When using with a form, wrap `InputOTP` in a `FormField` to connect it to the form's state and validation.

---

## Label

Renders an accessible label associated with controls.

### Installation

```bash
npx shadcn@latest add label
```

### Usage

The `Label` component is used to describe a form control. It's essential for accessibility.

```tsx
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function LabelDemo() {
  return (
    <div>
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    </div>
  )
}
```

### Best Practices

*   **Accessibility First:** Always use the `htmlFor` attribute on the `Label` and ensure its value matches the `id` of the form control it describes (e.g., `Input`, `Checkbox`, `Switch`). This is crucial for screen reader users.
*   **Clarity:** The label text should be clear and concise, accurately describing the purpose of the associated form control.
*   **Placement:** Position labels close to their corresponding controls to create a clear visual relationship.

---

## Menubar

A visually persistent menu common in desktop applications that provides quick access to a consistent set of commands.

### Installation

```bash
npx shadcn@latest add menubar
```

### Usage

The `Menubar` is composed of a `MenubarMenu` that contains a `MenubarTrigger` and `MenubarContent`.

```tsx
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"

export function MenubarDemo() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            New Window <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>New Incognito Window</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Print... <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
```

### Best Practices

*   **Structure:** Organize related commands within the same `MenubarMenu`. Use `MenubarSeparator` to create logical groupings inside a menu.
*   **Keyboard Navigation:** The component is fully keyboard accessible. Users can navigate between triggers with arrow keys and open menus with `Enter` or `Space`.
*   **Shortcuts:** Use the `MenubarShortcut` component to display keyboard shortcuts for commands, improving usability for power users.

---

## Navigation Menu

A collection of links for navigating websites.

### Installation

```bash
npx shadcn@latest add navigation-menu
```

### Usage

The `NavigationMenu` is a collection of links for navigating websites, often used in website headers.

```tsx
import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
]

export function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/"
                  >
                    <Icons.logo className="h-6 w-6" />
                    <div className="mb-2 mt-4 text-lg font-medium">
                      shadcn/ui
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Beautifully designed components built with Radix UI and
                      Tailwind CSS.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem href="/docs" title="Introduction">
                Re-usable components built using Radix UI and Tailwind CSS.
              </ListItem>
              <ListItem href="/docs/installation" title="Installation">
                How to install dependencies and structure your app.
              </ListItem>
              <ListItem href="/docs/primitives/typography" title="Typography">
                Styles for headings, paragraphs, lists...etc
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/docs" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Documentation
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
```

### Best Practices

*   **Integration with Routers:** Use the `asChild` prop on `NavigationMenuLink` to pass rendering to your router's `Link` component (e.g., Next.js `Link`). This ensures correct client-side navigation.
*   **Structure:** Use `NavigationMenuList` to wrap your list of `NavigationMenuItem` components. For dropdowns, use `NavigationMenuTrigger` to toggle a `NavigationMenuContent` area.
*   **Accessibility:** The component is built on Radix UI primitives and is fully keyboard accessible out of the box.

---

## Pagination

Pagination with page navigation, next, and previous links.

### Installation

```bash
npx shadcn@latest add pagination
```

### Usage

A basic example of the `Pagination` component.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function PaginationDemo() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
```

### Integrating with Next.js

To use Next.js's `<Link>` component for client-side navigation, you need to modify the `pagination.tsx` file.

1.  **Import `Link` from `next/link`** in `components/ui/pagination.tsx`.
2.  **Update the `PaginationLinkProps` type** to extend the props of the `Link` component instead of an `<a>` tag.
3.  **Replace the `<a>` tag with `<Link>`** inside the `PaginationLink` component.

Here are the required changes:

```diff
// components/ui/pagination.tsx
+ import Link from "next/link"

// ...

- type PaginationLinkProps = {
-   isActive?: boolean
- } & Pick<ButtonProps, "size"> & React.ComponentProps<"a">

+ type PaginationLinkProps = {
+  isActive?: boolean
+ } & Pick<ButtonProps, "size"> & React.ComponentProps<typeof Link>


const PaginationLink = ({ ...props }: PaginationLinkProps) => (
  <PaginationItem>
-    <a aria-current={isActive ? "page" : undefined} {...props} />
+    <Link aria-current={isActive ? "page" : undefined} {...props} />
  </PaginationItem>
)
```

### Best Practices

*   **State Management:** Manage the current page state in your parent component and pass it down to the `Pagination` component to render the correct active link and disabled states for previous/next buttons.
*   **Router Integration:** For single-page applications (SPAs), always integrate with your router (like Next.js Link) to ensure proper client-side navigation and prevent full-page reloads.
*   **Accessibility:** The `isActive` prop sets `aria-current="page"` on the active link, which is important for screen reader users.

---

## Popover

Displays rich content in a portal, triggered by a button.

### Installation

```bash
npx shadcn@latest add popover
```

### Usage

The `Popover` component is used to display content in a layer above the main page, triggered by an element like a button.

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input
                id="maxHeight"
                defaultValue="none"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### Best Practices

*   **Trigger Element:** Use the `asChild` prop on `PopoverTrigger` to pass the trigger props to a child component, avoiding nested interactive elements.
*   **Non-Modal:** Popovers are non-modal, meaning they don't block interaction with the rest of the page. They close when the user clicks outside of them or presses the `Escape` key.
*   **Content:** Keep the content inside a popover concise and relevant to the trigger's context.

---

## Progress

Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.

### Installation

```bash
npx shadcn@latest add progress
```

### Usage

The `Progress` component takes a `value` prop (from 0 to 100) to indicate the current progress. Here's an example of a progress bar that updates after a short delay.

```tsx
"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"

export function ProgressDemo() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return <Progress value={progress} className="w-[60%]" />
}
```

### Best Practices

*   **Accessibility:** For accessibility, provide a label that describes what the progress bar represents. You can use an `aria-label` or associate it with a visible `Label` component.
*   **Determinate vs. Indeterminate:** This component is for determinate tasks where the completion percentage is known. For indeterminate tasks, consider using a `Skeleton` or a spinner animation.
*   **Visual Feedback:** The progress bar provides clear visual feedback to the user about the status of a running task, improving the user experience.

---

## Radio Group

A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.

### Installation

```bash
npx shadcn@latest add radio-group
```

### Usage

A `RadioGroup` should contain multiple `RadioGroupItem` components. Each item should have an associated `Label`.

```tsx
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  )
}
```

### Example: Form Integration

Integrate `RadioGroup` with `react-hook-form` for seamless state management and validation.

```tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const FormSchema = z.object({
  type: z.enum(["all", "mentions", "none"], {
    required_error: "You need to select a notification type.",
  }),
})

export function RadioGroupForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values:", {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Notify me about...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="all" />
                    </FormControl>
                    <FormLabel className="font-normal">All new messages</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="mentions" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Direct messages and mentions
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="none" />
                    </FormControl>
                    <FormLabel className="font-normal">Nothing</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Best Practices

*   **Accessibility:** Always pair each `RadioGroupItem` with a `Label` using the `htmlFor` attribute. This ensures screen readers can correctly announce the options.
*   **Controlled Component:** When used in a form, control the `RadioGroup`'s value via `onValueChange` and `defaultValue` (or `value`) as shown in the `react-hook-form` example.
*   **Layout:** Use flexbox or grid utilities to arrange the radio items and their labels as needed.

---

## Resizable

Accessible resizable panel groups and layouts with keyboard support.

### Installation

```bash
npx shadcn@latest add resizable
```

### Usage

The `Resizable` component consists of a `ResizablePanelGroup`, `ResizablePanel`, and `ResizableHandle`.

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

export function ResizableDemo() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-[200px] items-center justify-center p-6">
          <span className="font-semibold">One</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-[200px] items-center justify-center p-6">
          <span className="font-semibold">Two</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Example: Vertical Layout

Set the `direction` prop to `"vertical"` for a vertical layout.

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

export function ResizableVerticalDemo() {
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-[200px] max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Header</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Example: Custom Handle

Use the `withHandle` prop on `ResizableHandle` to add a visible grabber icon.

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

export function ResizableHandleDemo() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Sidebar</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Best Practices

*   **Keyboard Navigation:** The panels can be resized using arrow keys, providing good accessibility.
*   **Size Control:** Use `defaultSize`, `minSize`, and `maxSize` props on `ResizablePanel` to control the dimensions.
*   **Layout Persistence:** For saving and restoring layouts, you can use the `onLayout` prop on `ResizablePanelGroup` to get the layout state and store it (e.g., in `localStorage`).

---

## Scroll Area

Augments native scroll functionality for custom, cross-browser styling.

### Installation

```bash
npx shadcn@latest add scroll-area
```

### Usage

Wrap your content with the `ScrollArea` component. You must give it a fixed height for the vertical scrollbar to appear.

```tsx
import { ScrollArea } from "@/components/ui/scroll-area"

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      Jokester began sneaking into the castle in the middle of the night and leaving jokes all over the place: under the king's pillow, in his soup, even in the royal toilet. The king was furious, but he couldn't seem to stop Jokester. And then, one day, the people of the kingdom discovered that the jokes left by Jokester were so funny that they couldn't help but laugh. And once they started laughing, they couldn't stop.
    </ScrollArea>
  )
}
```

### Example: Horizontal Scrolling

To enable horizontal scrolling, add the `ScrollBar` component with `orientation="horizontal"`.

```tsx
import * as React from "react"
import Image from "next/image"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export interface Artwork {
  artist: string
  art: string
}

export const works: Artwork[] = [
  {
    artist: "Ornella Binni",
    art: "https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80",
  },
  {
    artist: "Tom Byrom",
    art: "https://images.unsplash.com/photo-1548516173-3cabfa4607e9?auto=format&fit=crop&w=300&q=80",
  },
  {
    artist: "Vladimir Malyavko",
    art: "https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=300&q=80",
  },
]

export function ScrollAreaHorizontalDemo() {
  return (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {works.map((artwork) => (
          <figure key={artwork.artist} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <Image
                src={artwork.art}
                alt={`Photo by ${artwork.artist}`}
                className="aspect-[3/4] h-fit w-fit object-cover"
                width={300}
                height={400}
              />
            </div>
            <figcaption className="pt-2 text-xs text-muted-foreground">
              Photo by{" "}
              <span className="font-semibold text-foreground">
                {artwork.artist}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
```

### Best Practices

*   **Viewport Sizing:** The `ScrollArea` must have a constrained size (e.g., using `h-` or `w-` classes) for the scrollbars to appear.
*   **Horizontal Scrolling:** For horizontal layouts, use `whitespace-nowrap` on the `ScrollArea` and `flex` on the direct child to ensure content flows horizontally.
*   **Scrollbars:** The `ScrollBar` component is optional for vertical scrolling but required for horizontal scrolling. It can be styled and positioned as needed.

---

## Select

Displays a list of options for the user to pick from—triggered by a button.

### Installation

```bash
npx shadcn@latest add select
```

### Usage

The `Select` component is a wrapper around the other select components. `SelectTrigger` is the button that opens the dropdown, and `SelectContent` contains the list of `SelectItem` options.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SelectDemo() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### Example: Scrollable

For long lists, you can use `SelectGroup` to group related options under a `SelectLabel`. The content will automatically become scrollable.

```tsx
import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SelectScrollable() {
  return (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Europe & Africa</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
```

### Example: Form Integration

Integrate `Select` with `react-hook-form` for validation and state management.

```tsx
"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const FormSchema = z.object({
  email: z
    .string({
      required_error: "Please select an email to display.",
    })
    .email(),
})

export function SelectForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values:", {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="m@example.com">m@example.com</SelectItem>
                  <SelectItem value="m@google.com">m@google.com</SelectItem>
                  <SelectItem value="m@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                You can manage email addresses in your{" "}
                <Link href="/examples/forms">email settings</Link>.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Best Practices

*   **Placeholder:** Use the `placeholder` prop in `SelectValue` to show a default message when no option is selected.
*   **Accessibility:** The `Select` component is built on top of Radix UI primitives and is accessible out of the box, including keyboard navigation.
*   **Controlled Component:** For forms, control the component's state using `onValueChange` and `defaultValue` or `value` for seamless integration.

---

## Separator

Visually or semantically separates content.

### Installation

```bash
npx shadcn@latest add separator
```

### Usage

The `Separator` can be used to divide content sections. It defaults to a horizontal orientation, but can be set to vertical.

```tsx
import { Separator } from "@/components/ui/separator"

export function SeparatorDemo() {
  return (
    <div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <p className="text-sm text-muted-foreground">
          An open-source UI component library.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  )
}
```

### Best Practices

*   **Orientation:** Use the `orientation` prop to switch between `"horizontal"` (default) and `"vertical"` separators.
*   **Decorative vs. Semantic:** By default, the separator is a presentational element. If the separation is meaningful for accessibility, set `decorative={false}`.
*   **Spacing:** Use margin utilities (e.g., `my-4`) to create space around the separator for better visual hierarchy.

---

## Sheet

Extends the Dialog component to display content that complements the main content of the screen, typically sliding in from the side.

### Installation

```bash
npx shadcn@latest add sheet
```

### Usage

The `Sheet` component is composed of several parts: `Sheet`, `SheetTrigger`, and `SheetContent`. You can also use `SheetHeader`, `SheetTitle`, `SheetDescription`, and `SheetFooter` to structure your content.

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {/* Sheet content goes here */}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### Example: Side Placement

You can use the `side` prop on `SheetContent` to specify which edge of the screen the sheet should appear from. The options are `top`, `bottom`, `left`, and `right` (default).

```tsx
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

export function SheetSideDemo() {
  return (
    <Sheet>
      <SheetTrigger>Open Left</SheetTrigger>
      <SheetContent side="left">
        {/* Sheet content */}
      </SheetContent>
    </Sheet>
  )
}
```

### Example: Custom Size

Adjust the size of the sheet by applying standard Tailwind CSS width/height classes to the `SheetContent` component.

```tsx
<SheetContent className="w-[400px] sm:w-[540px]">
  {/* Sheet content */}
</SheetContent>
```

### Best Practices

*   **Positioning:** Choose the `side` that makes the most sense for your layout and content. `right` and `left` are common for sidebars and menus.
*   **Content Structure:** Use `SheetHeader`, `SheetTitle`, and `SheetDescription` to provide clear, accessible context for the sheet's content.
*   **Responsive Sizing:** Use responsive Tailwind CSS classes (e.g., `sm:w-`, `md:w-`) to ensure the sheet looks good on all screen sizes.

---

## Sidebar

A composable, themeable, and customizable sidebar component.

### Installation

1.  Run the following command:

    ```bash
    npx shadcn@latest add sidebar
    ```

2.  The command should add the required CSS variables. If not, add the following to your global CSS file:

    ```css
    @layer base {
      :root {
        --sidebar: oklch(0.985 0 0);
        --sidebar-foreground: oklch(0.145 0 0);
        /* ... other variables */
      }
      .dark {
        --sidebar: oklch(0.205 0 0);
        --sidebar-foreground: oklch(0.985 0 0);
        /* ... other variables */
      }
    }
    ```

### Component Structure

The `Sidebar` is composed of several parts that work together:

*   **SidebarProvider:** Wraps your layout to provide context for the sidebar's state.
*   **Sidebar:** The main container for the sidebar content.
*   **SidebarTrigger:** A button to toggle the sidebar's visibility.
*   **SidebarHeader & SidebarFooter:** Sticky sections at the top and bottom.
*   **SidebarContent:** The main scrollable area for sidebar items.
*   **SidebarGroup:** Used to group related menu items.

### How to Create a Basic Sidebar

1.  **Update Your Layout:** Wrap your root layout with `SidebarProvider` and add the `SidebarTrigger`.

    ```tsx
    // app/layout.tsx
    import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
    import { AppSidebar } from "@/components/app-sidebar" // We will create this next

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <html lang="en">
          <body>
            <SidebarProvider>
              <AppSidebar />
              <main>
                <SidebarTrigger />
                {children}
              </main>
            </SidebarProvider>
          </body>
        </html>
      )
    }
    ```

2.  **Create the Sidebar Component:** Create a new file `components/app-sidebar.tsx`.

    ```tsx
    // components/app-sidebar.tsx
    import { Home, Settings } from "lucide-react"
    import {
      Sidebar,
      SidebarContent,
      SidebarGroup,
      SidebarItem,
      SidebarLink,
    } from "@/components/ui/sidebar"

    export function AppSidebar() {
      return (
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarLink href="#" icon={Home}>Home</SidebarLink>
              <SidebarLink href="#" icon={Settings}>Settings</SidebarLink>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )
    }
    ```

### Customization

You can customize the `Sidebar` component using the following props:

*   **side:** `left` (default) or `right`.
*   **variant:** `sidebar` (default), `floating`, or `inset`.
*   **collapsible:** `offcanvas` (collapses off-screen), `icon` (collapses to show only icons), or `none`.

```tsx
<Sidebar side="right" variant="floating" collapsible="icon">
  {/* ... */}
</Sidebar>
```

### Best Practices

*   **Component Composition:** Build your sidebar by composing the provided sub-components (`SidebarHeader`, `SidebarContent`, `SidebarGroup`, etc.) to fit your needs.
*   **Layout Integration:** Always wrap the relevant part of your application with `SidebarProvider` to ensure the context is available.
*   **Routing:** Use Next.js's `Link` component or a standard `<a>` tag within `SidebarLink` for navigation.

---

## Chart

Beautiful, composable charts built on top of [Recharts](https://recharts.org/).

### Installation

1.  Run the following command to add the chart components:

    ```bash
    npx shadcn@latest add chart
    ```

2.  Add the required chart color variables to your global CSS file:

    ```css
    @layer base {
      :root {
        --chart-1: oklch(0.646 0.222 41.116);
        --chart-2: oklch(0.6 0.118 184.704);
        --chart-3: oklch(0.398 0.07 227.392);
        --chart-4: oklch(0.828 0.189 84.429);
        --chart-5: oklch(0.769 0.188 70.08);
      }
      .dark {
        --chart-1: oklch(0.488 0.243 264.376);
        --chart-2: oklch(0.696 0.17 162.48);
        --chart-3: oklch(0.769 0.188 70.08);
        --chart-4: oklch(0.627 0.265 303.9);
        --chart-5: oklch(0.645 0.246 16.439);
      }
    }
    ```

### How to Create a Chart

Follow these steps to build a complete bar chart.

1.  **Define Your Data:** Create an array of objects for your chart data.

    ```tsx
    const chartData = [
      { month: "January", desktop: 186, mobile: 80 },
      { month: "February", desktop: 305, mobile: 200 },
      { month: "March", desktop: 237, mobile: 120 },
    ];
    ```

2.  **Define Chart Configuration:** Set up a `chartConfig` object to define labels, colors, and icons for your data series.

    ```tsx
    import { type ChartConfig } from "@/components/ui/chart"

    const chartConfig = {
      desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
      },
      mobile: {
        label: "Mobile",
        color: "hsl(var(--chart-2))",
      },
    } satisfies ChartConfig;
    ```

3.  **Build the Chart:** Compose the chart using `ChartContainer` and Recharts components like `BarChart`, `CartesianGrid`, `XAxis`, `ChartTooltip`, and `ChartLegend`.

    ```tsx
    "use client"

    import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
    import {
      ChartConfig,
      ChartContainer,
      ChartLegend,
      ChartLegendContent,
      ChartTooltip,
      ChartTooltipContent,
    } from "@/components/ui/chart"

    export function BarChartExample() {
      return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      )
    }
    ```

### Best Practices

*   **Accessibility:** Always include the `accessibilityLayer` prop on your chart component (e.g., `<BarChart accessibilityLayer>`) to enable keyboard navigation and screen reader support.
*   **Responsive Container:** Set a minimum height (e.g., `min-h-[200px]`) on the `ChartContainer` to ensure it displays correctly and is responsive.
*   **Theming:** Use the `chartConfig` to manage themes and colors centrally. This makes it easy to maintain a consistent look and feel across multiple charts.

---

## Skeleton

Use to show a placeholder while content is loading, improving the user experience by indicating that information is on its way.

### Installation

Run the following command to add the skeleton component:

```bash
npx shadcn@latest add skeleton
```

### Usage

Import the `Skeleton` component and apply dimensions and styling using Tailwind CSS classes.

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonExample() {
  return <Skeleton className="h-8 w-48 rounded-md" />
}
```

### Example: Card Skeleton

You can compose multiple `Skeleton` components to create a placeholder for a more complex UI element, like a card.

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}
```

### Best Practices

*   **Match Dimensions:** Make the skeleton's dimensions (width, height, border-radius) as close as possible to the actual content it's replacing. This prevents layout shifts when the content loads.
*   **Structure:** For complex components, build a skeleton structure that mimics the layout of the final component.
*   **Animation:** The default skeleton includes a subtle pulse animation to indicate an active loading state. This is generally good for UX.

---

## Slider

An input where the user selects a value from within a given range.

### Installation

Run the following command to add the slider component:

```bash
npx shadcn@latest add slider
```

### Usage

Import the `Slider` component and configure its range and default value.

```tsx
import { Slider } from "@/components/ui/slider"

export function SliderExample() {
  return (
    <Slider
      defaultValue={[50]}
      max={100}
      step={1}
      className="w-[60%]"
    />
  )
}
```

### Best Practices

*   **Controlled vs. Uncontrolled:** Use `defaultValue` for uncontrolled usage. For a controlled component, use the `value` prop and manage its state with an `onValueChange` callback.
*   **Range:** The `Slider` can be used for a single value or a range by passing one or two values in the `defaultValue` or `value` array.
*   **Accessibility:** The slider is built on top of Radix UI's Slider primitive and is accessible by default, supporting keyboard navigation.
*   **Labels:** Always provide a visible label (e.g., using the `Label` component) to describe the slider's purpose.

---

## Sonner

An opinionated toast component for React that can be used to display non-intrusive notifications.

### Installation

1.  Run the following command to add the `sonner` component:

    ```bash
    npx shadcn@latest add sonner
    ```

2.  Add the `<Toaster />` component to your app's root layout to ensure toasts are rendered correctly.

    ```tsx
    // app/layout.tsx
    import { Toaster } from "@/components/ui/sonner"

    export default function RootLayout({ children }) {
      return (
        <html lang="en">
          <body>
            {children}
            <Toaster />
          </body>
        </html>
      )
    }
    ```

### Usage

Import the `toast` function from `sonner` and call it from anywhere in your application to display a notification.

```tsx
"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function SonnerExample() {
  return (
    <Button
      variant="outline"
      onClick={() => toast("Your request has been submitted.")}
    >
      Show Toast
    </Button>
  )
}
```

### Toast Types

You can trigger different types of toasts for different scenarios.

-   **Success:** `toast.success("Changes saved successfully!")`
-   **Error:** `toast.error("Failed to save changes.")`
-   **With Action:**

    ```tsx
    toast("An event was created.", {
      action: {
        label: "Undo",
        onClick: () => console.log("Undo"),
      },
    })
    ```

### Best Practices

*   **Rich Colors:** Add the `richColors` prop to the `<Toaster />` component to get pre-styled toasts for success, error, warning, and info types.
*   **Positioning:** You can change the position of the toasts using the `position` prop on `<Toaster />` (e.g., `position="top-right"`). The default is `bottom-right`.
*   **Headless:** Sonner is headless, allowing for extensive customization via the `toastOptions` prop on the `Toaster` or by passing custom components.

---

## Switch

A control that allows the user to toggle between checked and not checked.

### Installation

Run the following command to add the switch component:

```bash
npx shadcn@latest add switch
```

### Usage

Import the `Switch` component and use it with a `Label` for accessibility.

```tsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function SwitchExample() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  )
}
```

### Example: Form Integration

The `Switch` component integrates seamlessly with `react-hook-form` for managing form state.

```tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"

const FormSchema = z.object({
  marketing_emails: z.boolean().default(false).optional(),
})

export function SwitchForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { marketing_emails: false },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // Handle form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="marketing_emails"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Marketing emails</FormLabel>
                <FormDescription>
                  Receive emails about new products and features.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Best Practices

*   **Accessibility:** Always associate a `Label` with the `Switch` using the `htmlFor` and `id` attributes. This is crucial for screen reader users.
*   **Controlled Component:** When used in a form, control the component's state via the `checked` and `onCheckedChange` props.
*   **Disabled State:** Use the `disabled` prop to prevent user interaction. When disabled, the switch is not focusable and its value cannot be changed.

---

## Table

A responsive table component for displaying data.

### Installation

Run the following command to add the table component:

```bash
npx shadcn@latest add table
```

### Usage

The `Table` component is composed of several sub-components to create a semantically correct and accessible table.

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
]

export function TableExample() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Best Practices

*   **Semantic Structure:** Always use the provided sub-components (`TableHeader`, `TableHead`, `TableBody`, `TableRow`, `TableCell`) to maintain proper HTML semantics.
*   **Caption:** Include a `TableCaption` to provide a summary of the table's content for accessibility.
*   **Advanced Features:** For tables requiring sorting, filtering, or pagination, refer to the **Data Table** documentation, which is built upon this basic `Table` component and integrates with TanStack Table.

---

## Tabs

A set of layered sections of content—known as tab panels—that are displayed one at a time.

### Installation

Run the following command to add the tabs component:

```bash
npx shadcn@latest add tabs
```

### Usage

The `Tabs` component is composed of a list of triggers and their associated content panels.

```tsx
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function TabsExample() {
  return (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Account Form Fields */}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Password Form Fields */}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
```

### Best Practices

*   **Default Value:** Always provide a `defaultValue` to the `Tabs` component to specify which tab should be active on initial render.
*   **Value Association:** Ensure that the `value` prop of each `TabsTrigger` matches the `value` prop of its corresponding `TabsContent`.
*   **Accessibility:** The component is built on Radix UI's Tabs primitive, making it accessible out of the box with keyboard navigation support.

---

## Textarea

Displays a form textarea or a component that looks like a textarea.

### Installation

Run the following command to add the textarea component:

```bash
npx shadcn@latest add textarea
```

### Usage

Import the `Textarea` component and use it with a `Label` for accessibility.

```tsx
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function TextareaExample() {
  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">Your Message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  )
}
```

### Example: With Button

You can compose the `Textarea` with other components like `Button` to create interactive elements.

```tsx
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function TextareaWithButton() {
  return (
    <div className="grid w-full gap-2">
      <Textarea placeholder="Type your message here." />
      <Button>Send message</Button>
    </div>
  )
}
```

### Example: Form Integration

The `Textarea` component integrates seamlessly with `react-hook-form` and `zod` for validation.

```tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

const FormSchema = z.object({
  bio: z.string().min(10, {
    message: "Bio must be at least 10 characters.",
  }),
})

export function TextareaForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // Handle form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can @mention other users and organizations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Best Practices

*   **Accessibility:** Always pair `Textarea` with a `Label` using `htmlFor` and `id` for screen reader support.
*   **Controlled Component:** Use with form libraries like `react-hook-form` to control its state and handle validation.
*   **Resizing:** By default, textareas are resizable. Use the `resize-none` Tailwind CSS utility class to disable this behavior if needed.

---

## Toast

A succinct message that is displayed temporarily.

### Note on Implementation

The `Toast` component in `shadcn/ui` has been updated to use **Sonner** as the recommended library for handling toast notifications.

For the latest implementation, usage, and best practices, please refer to the **[Sonner](#sonner)** section of this documentation.

---

## Toggle

A two-state button that can be either on or off.

### Installation

Run the following command to add the toggle component:

```bash
npx shadcn@latest add toggle
```

### Usage

Import the `Toggle` component and use it with an icon or text.

```tsx
import { Bold } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"

export function ToggleExample() {
  return (
    <Toggle aria-label="Toggle bold">
      <Bold className="h-4 w-4" />
    </Toggle>
  )
}
```

### Examples

#### Outline Variant

Use the `variant="outline"` prop for a bordered style.

```tsx
import { Italic } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"

export function ToggleOutline() {
  return (
    <Toggle variant="outline" aria-label="Toggle italic">
      <Italic className="h-4 w-4" />
    </Toggle>
  )
}
```

#### With Text

Combine an icon and text for a more descriptive toggle.

```tsx
import { Italic } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"

export function ToggleWithText() {
  return (
    <Toggle aria-label="Toggle italic">
      <Italic className="h-4 w-4 mr-2" />
      Italic
    </Toggle>
  )
}
```

#### Sizing

Use the `size` prop to control the toggle's dimensions. It supports `sm`, `default`, and `lg`.

```tsx
import { Italic } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"

export function ToggleSizes() {
  return (
    <div className="flex items-center space-x-2">
      <Toggle size="sm" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle size="lg" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </Toggle>
    </div>
  )
}
```

### Best Practices

*   **Accessibility:** Always provide an `aria-label` when the toggle only contains an icon to ensure it's accessible to screen readers.
*   **State Management:** Control the toggle's state using the `pressed` and `onPressedChange` props for controlled behavior.
*   **Variants:** Use the `variant` prop (`default` or `outline`) to match your UI design.

---

## Toggle Group

A set of two-state buttons that can be toggled on or off.

### Installation

Run the following command to add the toggle group component:

```bash
npx shadcn@latest add toggle-group
```

### Usage

Import `ToggleGroup` and `ToggleGroupItem` to create a set of related toggles.

```tsx
import { Bold, Italic, Underline } from "lucide-react"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export function ToggleGroupExample() {
  return (
    <ToggleGroup type="multiple">
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <Underline className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### Examples

#### Single Selection

Set `type="single"` to allow only one item to be selected at a time.

```tsx
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export function ToggleGroupSingle() {
  return (
    <ToggleGroup type="single">
      <ToggleGroupItem value="left" aria-label="Left aligned">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Center aligned">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Right aligned">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

#### Outline Variant

Use `variant="outline"` for a bordered style.

```tsx
import { Bold, Italic, Underline } from "lucide-react"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export function ToggleGroupOutline() {
  return (
    <ToggleGroup type="multiple" variant="outline">
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <Underline className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### Best Practices

*   **Selection Type:** Use `type="single"` for radio-like behavior (one selection) and `type="multiple"` for checkbox-like behavior (multiple selections).
*   **Accessibility:** Provide a unique `value` and an `aria-label` for each `ToggleGroupItem` to ensure accessibility.
*   **State Management:** Control the group's value using the `value` and `onValueChange` props.

---

## Tooltip

A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.

### Installation

Run the following command to add the tooltip component:

```bash
npx shadcn@latest add tooltip
```

### Usage

To enable tooltips, you must wrap your application or a layout component with the `TooltipProvider`. Then, use the `Tooltip`, `TooltipTrigger`, and `TooltipContent` components.

**1. Add the Provider (e.g., in `layout.tsx`)**

```tsx
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
```

**2. Use the Tooltip in your component**

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

export function TooltipExample() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip!</p>
      </TooltipContent>
    </Tooltip>
  )
}
```

### Best Practices

*   **Provider:** Always wrap your application root or a common layout with `<TooltipProvider>` to ensure tooltips function correctly across your app.
*   **Trigger Element:** Use the `asChild` prop on `TooltipTrigger` when wrapping a custom component (like `Button`) to ensure props are passed correctly and avoid rendering an extra DOM element.
*   **Accessibility:** Tooltips are designed to be accessible, providing information on hover and focus. Ensure the trigger element is focusable.

---

## Typography

Styles for headings, paragraphs, lists, and other text elements. Unlike other components, these are utility classes that you can apply to your HTML tags.

### Usage

Apply the corresponding `className` to any text element to style it.

### Headings

```tsx
// h1
<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
  Taxing Laughter: The Joke Tax Chronicles
</h1>

// h2
<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
  The King's Plan
</h2>

// h3
<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
  The Joke Tax
</h3>

// h4
<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
  People stopped telling jokes
</h4>
```

### Body & Paragraphs

```tsx
// p
<p className="leading-7 [&:not(:first-child)]:mt-6">
  The king, seeing how much happier his subjects were, realized the error of his ways and repealed the joke tax.
</p>

// blockquote
<blockquote className="mt-6 border-l-2 pl-6 italic">
  "After all," he said, "everyone enjoys a good joke, so it's only fair that they should pay for the privilege."
</blockquote>

// ul
<ul className="my-6 ml-6 list-disc [&>li]:mt-2">
  <li>1st level of puns: 5 gold coins</li>
  <li>2nd level of jokes: 10 gold coins</li>
</ul>
```

### Inline & Utility Styles

```tsx
// Inline Code
<code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
  @radix-ui/react-alert-dialog
</code>

// Lead
<p className="text-xl text-muted-foreground">
  A modal dialog that interrupts the user with important content and expects a response.
</p>

// Large
<div className="text-lg font-semibold">Are you absolutely sure?</div>

// Small
<small className="text-sm font-medium leading-none">Email address</small>

// Muted
<p className="text-sm text-muted-foreground">Enter your email address.</p>
```

### Best Practices

*   **Semantic HTML:** Always use the appropriate HTML tags for your content (e.g., `<h1>` for main titles, `<p>` for paragraphs) and apply these classes for styling.
*   **Consistency:** Use these typography classes consistently throughout your application to maintain a uniform look and feel.

---
